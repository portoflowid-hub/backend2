import Enrollment from '../../models/enrollment/Enrollment.js'
import Course from '../../models/course/Course.js'
import mongoose from 'mongoose'

// Enroll current user as student (atomic: check capacity => create enrollment)
export const enrollCourse = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const courseId = req.params.id
    const userId = req.user.id // from verifyToken

    const course = await Course.findById(courseId).session(session)
    if (!course) {
      await session.abortTransaction()
      return res
        .status(404)
        .json({ status: 'fail', message: 'Course not found' })
    }

    // if course has capacity, check current enrolled count
    if (Number.isFinite(course.capacity) && course.capacity !== null) {
      const count = await Enrollment.countDocuments({
        course: courseId,
        role: 'student',
        status: 'enrolled'
      }).session(session)
      if (count >= course.capacity) {
        await session.abortTransaction()
        return res
          .status(400)
          .json({ status: 'fail', message: 'Course is full' })
      }
    }

    // create enrollment (unique index prevents duplicates)
    const enrollment = await Enrollment.create(
      [{ user: userId, course: courseId, role: 'student', status: 'enrolled' }],
      { session }
    )

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
      status: 'success',
      message: 'Enrolled successfully',
      data: enrollment[0]
    })
  } catch (err) {
    await session.abortTransaction()
    session.endSession()
    // handle duplicate key (already enrolled)
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ status: 'fail', message: 'Already enrolled' })
    }
    return res.status(500).json({ status: 'error', message: err.message })
  }
}

// Unenroll (student can cancel their enrollment)
export const unenrollCourse = async (req, res) => {
  try {
    const courseId = req.params.id
    const userId = req.user.id

    const removed = await Enrollment.findOneAndDelete({
      course: courseId,
      user: userId,
      role: 'student'
    })
    if (!removed)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Enrollment not found' })

    return res
      .status(200)
      .json({ status: 'success', message: 'Unenrolled successfully' })
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message })
  }
}

// Admin / instructor: list students of a course
export const listCourseStudents = async (req, res) => {
  try {
    const courseId = req.params.id
    const { page = 1, limit = 20, q = '' } = req.query
    const skip = (page - 1) * limit

    const filter = { course: courseId, role: 'student', status: 'enrolled' }

    const [rows, total] = await Promise.all([
      Enrollment.find(filter)
        .populate('user', 'fullName username email avatarUrl')
        .sort({ enrolledAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit)),
      Enrollment.countDocuments(filter)
    ])

    return res.status(200).json({
      status: 'success',
      data: rows,
      meta: { total, page: Number(page), limit: Number(limit) }
    })
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message })
  }
}

// Get all enrollments for current user
export const getMyEnrollments = async (req, res) => {
  try {
    const userId = req.user.id
    const enrollments = await Enrollment.find({ user: userId })
      .populate('course', 'title description price')
      .populate('user', 'fullName email')
      .sort({ enrolledAt: -1 })
    return res.status(200).json({ status: 'success', data: enrollments })
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message })
  }
}

// Admin: change enrollment role/status (e.g., promote to TA, mark completed)
export const updateEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params
    const updates = req.body // { role: 'ta' } or { status: 'completed', progress: 100 }
    const allowed = ['role', 'status', 'progress', 'grade', 'completedAt']
    const payload = {}

    allowed.forEach(k => {
      if (k in updates) payload[k] = updates[k]
    })

    const updated = await Enrollment.findByIdAndUpdate(enrollmentId, payload, {
      new: true,
      runValidators: true
    })
    if (!updated)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Enrollment not found' })
    return res.status(200).json({ status: 'success', data: updated })
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message })
  }
}
