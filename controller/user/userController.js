import User from '../../models/user/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const register = async (req, res) => {
  try {
    const { fullName, username, email, password, dateOfBirth, gender } =
      req.body

    if (
      !fullName ||
      !username ||
      !email ||
      !password ||
      !dateOfBirth ||
      !gender
    ) {
      return res.status(400).json({
        status: 'fail',
        message: 'All fields are required'
      })
    }

    const isExist = await User.findOne({ username })
    if (isExist) {
      return res.status(409).json({
        status: 'fail',
        message: 'User already exist'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
      dateOfBirth,
      gender,
      role: 'user'
    })

    await user.save()

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully'
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    })
  }
}

const login = async (req, res) => {
  try {
    const { email, username, password } = req.body

    const user = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      })
    }

    const passwordIsMatch = await bcrypt.compare(password, user.password)
    if (!passwordIsMatch) {
      return res.status(400).json({
        status: 'fail',
        message: 'Wrong password'
      })
    }

    const safeUserData = {
      id: user._id,
      username: user.username,
      role: user.role
    }

    const accessToken = jwt.sign(safeUserData, process.env.JWT_SECRET, {
      expiresIn: '15m'
    })

    const refreshToken = jwt.sign(safeUserData, process.env.REFRESH_TOKEN, {
      expiresIn: '7d'
    })

    user.refreshToken = refreshToken
    await user.save()

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({
      message: 'Login Successfully',
      accessToken: accessToken,
      refreshToken: refreshToken,
      role: user.role
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    })
  }
}

const getToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
      return res.status(401).json({
        status: 'Error',
        message: 'Unavailable refresh token'
      })
    }

    const storedUser = await User.findOne({ refreshToken })
    if (!storedUser) {
      return res.status(403).json({
        status: 'fail',
        message: 'Refresh token not found or already revoked'
      })
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, user) => {
      if (err) {
        return res.status(403).json({
          status: 'fail',
          message: 'Invalid or expired refresh token'
        })
      }

      const newAccessToken = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      )

      return res.status(200).json({
        status: 'success',
        message: 'Access token refreshed successfully',
        accessToken: newAccessToken
      })
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    })
  }
}

const getAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find().select('-password -refreshToken')
    res.status(200).json({
      status: 'success',
      message: 'Successfully get all users',
      data: allUsers
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      status: error,
      message: 'Internal server error',
      error: error.message
    })
  }
}

const getUser = async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findById(id).select('-password -refreshToken')

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      })
    }

    res.status(200).json({
      status: 'success',
      message: 'Successfully get user',
      data: user
    })
  } catch (error) {
    console.error('Error in get user: ', error)
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    })
  }
}

const updateUser = async (req, res) => {
  try {
    const { id } = req.params

    const updateData = req.body
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })

    if (!updatedUser) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found'
      })
    }

    res.status(200).json({
      status: 'success',
      message: 'User data updated successfully',
      data: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        email: updatedUser.email,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender
      }
    })
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ status: 'fail', errors })
    }

    if (error.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email already registered'
      })
    }

    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    })
  }
}

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    const deletedUser = await User.findByIdAndDelete(id)
    if (!deletedUser) {
      res.status(404).json({
        status: 'fail',
        message: 'User not found',
        data: deletedUser
      })
    }

    res.status(200).json({
      status: 'success',
      message: 'User successfully deleted'
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    })
  }
}

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) return res.sendStatus(204)

    await User.findOneAndUpdate({ refreshToken }, { refreshToken: null })

    res.clearCookie('refreshToken')
    res.status(200).json({ message: 'Logged out successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Logout failed', error: err.message })
  }
}

export {
  login,
  register,
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  getToken,
  logout
}
