import User from '../../models/user/User.js'
import Course from '../../models/course/Course.js'
import Enrollment from '../../models/enrollment/Enrollment.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const ALLOWED_ROLES = ['admin', 'instructor', 'ta', 'student']

// Helper: generate tokens and set cookies
const generateTokens = async (user, res) => {
  const payload = {
    id: user._id.toString(),
    username: user.username,
    role: user.role
  }

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '15m'
  })

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN, {
    expiresIn: '7d'
  })

  user.refreshToken = refreshToken
  await user.save()

  // Set httpOnly cookie for refresh token (used to refresh accessToken)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
  })

  return accessToken
}

// -- User Management --
export const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find().select('-password -refreshToken -__v')
    res.status(200).json({ status: 'success', data: users })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
}

// Create user by admin (route protected)
export const createUserAdmin = async (req, res) => {
  try {
    const {
      fullName,
      username,
      email,
      password,
      dateOfBirth,
      gender,
      role = 'student'
    } = req.body

    if (
      ![fullName, username, email, password, dateOfBirth, gender].every(Boolean)
    ) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'All fields are required' })
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'Role not allowed' })
    }

    const exists = await User.findOne({ $or: [{ username }, { email }] })
    if (exists) {
      return res
        .status(409)
        .json({ status: 'fail', message: 'Username or email already in use' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const newUser = new User({
      fullName,
      username,
      email,
      password: hashed,
      dateOfBirth,
      gender,
      role
    })
    await newUser.save()

    const accessToken = generateTokens(newUser, res) // newUser, res, bool

    res.status(201).json({
      status: 'success',
      message: 'User created by admin',
      data: { id: newUser._id, username: newUser.username, role: newUser.role },
      accessToken
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
}

// Admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, username, password } = req.body
    const user = await User.findOne({ $or: [{ email }, { username }] })
    if (!user) {
      return res.status(400).json({ status: 'fail', message: 'User not found' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ status: 'fail', message: 'Wrong password' })
    }

    const accessToken = await generateTokens(user, res)

    res
      .status(200)
      .json({ status: 'success', message: 'Login successful', accessToken })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
}

// refreshToken cookie (with rotation)
export const refreshTokenAdmin = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken
    if (!oldRefreshToken) {
      return res
        .status(401)
        .json({ status: 'fail', message: 'Unavailable refresh token' })
    }

    const user = await User.findOne({ refreshToken: oldRefreshToken })
    if (!user) {
      return res
        .status(403)
        .json({ status: 'fail', message: 'Refresh token not found in DB' })
    }

    jwt.verify(
      oldRefreshToken,
      process.env.REFRESH_TOKEN,
      async (err, decoded) => {
        if (err) {
          return res
            .status(403)
            .json({
              status: 'fail',
              message: 'Invalid or expired refresh token'
            })
        }

        const payload = {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role
        }
        // Generate accessToken baru
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: '15m'
        })

        // Generate refreshToken baru (ROTASI)
        const newRefreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN, {
          expiresIn: '7d'
        })

        user.refreshToken = newRefreshToken
        await user.save()

        // Set cookie baru
        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        return res.status(200).json({ status: 'success', accessToken })
      }
    )
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

// Logout admin — clear refresh cookie
export const logoutAdmin = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken

    if (refreshToken) {
      await User.findOneAndUpdate({ refreshToken }, { refreshToken: null })
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })
    return res.status(200).json({ status: 'success', message: 'Logged out' })
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message })
  }
}

export const updateUserAdmin = async (req, res) => {
  try {
    const { id } = req.params
    const updates = { ...req.body }

    if (updates.role && !ALLOWED_ROLES.includes(updates.role)) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'Role not allowed' })
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10)
    }
    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).select('-password -__v')
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' })
    }
    res
      .status(200)
      .json({ status: 'success', message: 'User updated by admin', data: user })
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ status: 'fail', errors })
    }
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'Duplicate field value' })
    }
    res.status(500).json({ status: 'error', message: err.message })
  }
}

// Get all enrollments in the system
export const getAllEnrollmentsAdmin = async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate('user', 'fullName username email')
      .populate('course', 'title')
      .sort({ enrolledAt: -1 })
    res.status(200).json({ status: 'success', data: enrollments })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
}

// Delete an enrollment by ID
export const deleteEnrollmentAdmin = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await Enrollment.findByIdAndDelete(id)
    if (!deleted) {
      return res
        .status(404)
        .json({ status: 'fail', message: 'Enrollment not found' })
    }
    res.status(200).json({ status: 'success', message: 'Enrollment deleted' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
}

export const deleteUserAdmin = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await User.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ status: 'fail', message: 'User not found' })
    }
    await Enrollment.deleteMany({ user: id })
    res
      .status(200)
      .json({ status: 'success', message: 'User deleted by admin' })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
}

// Admin dashboard stats
export const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, totalCourses, totalEnrollments] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments()
    ])

    res.status(200).json({
      status: 'success',
      data: { totalUsers, totalCourses, totalEnrollments }
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
}
