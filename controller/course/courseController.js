import mongoose from 'mongoose'
import User from '../../models/user/User.js'
import Course from '../../models/course/Course.js'
import Enrollment from '../../models/enrollment/Enrollment.js'

// util: validate array of ids exist in User collection
const validateUserIds = async (ids = []) => {
  const filtered = ids.filter(id => mongoose.isValidObjectId(id))
  if (filtered.length === 0) return []
  const found = await User.find({ _id: { $in: filtered } })
    .select('_id')
    .lean()
  return found.map(f => f._id.toString())
}

// —— Course management ——
export const getAllCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      q = '',
      tags,
      level,
      instructor,
      isPublished,
      sort = '-createdAt'
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    const filter = {}

    if (q) filter.$text = { $search: q }
    if (tags) filter.tags = { $in: tags.split(',').map(t => t.trim()) }
    if (level) filter.level = level
    if (typeof isPublished !== 'undefined')
      filter.isPublished = isPublished === 'true'
    if (instructor && mongoose.isValidObjectId(instructor))
      filter.instructors = instructor

    const courses = await Course.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'username email')
      .populate('instructors', 'fullName username email')
      .populate('teachingAssistants', 'fullName username email')
      .lean()

    const courseIds = courses.map(c => c._id)
    // batch student counts
    const counts = await Enrollment.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          role: 'student',
          status: 'enrolled'
        }
      },
      { $group: { _id: '$course', count: { $sum: 1 } } }
    ])

    const countMap = counts.reduce((m, r) => {
      m[r._id.toString()] = r.count
      return m
    }, {})

    let userEnrolledMap = {}
    if (req.user?.id) {
      const userEnrolls = await Enrollment.find({
        user: req.user.id,
        course: { $in: courseIds },
        status: 'enrolled'
      })
        .select('course')
        .lean()
      userEnrolledMap = userEnrolls.reduce((m, e) => {
        m[e.course.toString()] = true
        return m
      }, {})
    }

    const enriched = courses.map(c => ({
      ...c,
      studentCount: countMap[c._id.toString()] || 0,
      isEnrolled: !!userEnrolledMap[c._id.toString()]
    }))

    const total = await Course.countDocuments(filter)

    res.status(200).json({
      status: 'success',
      data: enriched,
      meta: { total, page: Number(page), limit: Number(limit) }
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
}

// GET /api/courses/:id
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id))
      return res
        .status(400)
        .json({ status: 'fail', message: 'Invalid course id' })

    const course = await Course.findById(id)
      .populate('createdBy', 'username email')
      .populate('instructors', 'fullName username email')
      .populate('teachingAssistants', 'fullName username email')
      .lean()

    if (!course)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Course not found' })

    const studentCount = await Enrollment.countDocuments({
      course: id,
      role: 'student',
      status: 'enrolled'
    })

    const isEnrolled = req.user?.id
      ? !!(await Enrollment.findOne({
          course: id,
          user: req.user.id,
          status: 'enrolled'
        }).select('_id'))
      : false

    res.status(200).json({
      status: 'success',
      data: { ...course, studentCount, isEnrolled }
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
}

// POST /api/courses
export const createCourse = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const {
      title,
      description = '',
      price = 0,
      instructors = [],
      teachingAssistants = [],
      capacity,
      tags = [],
      category = '',
      level = 'beginner',
      language,
      imageUrl,
      isPublished
    } = req.body

    if (!title) {
      await session.abortTransaction()
      return res
        .status(400)
        .json({ status: 'fail', message: 'Title is required' })
    }

    // validate instructor & ta ids
    const validInstructors = await validateUserIds(
      Array.isArray(instructors) ? instructors : []
    )
    const validTAs = await validateUserIds(
      Array.isArray(teachingAssistants) ? teachingAssistants : []
    )

    // create course
    const course = await Course.create(
      [
        {
          title,
          description,
          price,
          createdBy: req.user.id,
          instructors: validInstructors,
          teachingAssistants: validTAs,
          capacity: capacity ?? null,
          tags,
          category,
          level,
          language,
          imageUrl,
          isPublished: !!isPublished
        }
      ],
      { session }
    )

    // create Enrollment records for instructors & TAs (so they appear in enrollment lists)
    const enrollDocs = []
    validInstructors.forEach(uid =>
      enrollDocs.push({
        user: uid,
        course: course[0]._id,
        role: 'instructor',
        status: 'enrolled'
      })
    )
    validTAs.forEach(uid =>
      enrollDocs.push({
        user: uid,
        course: course[0]._id,
        role: 'ta',
        status: 'enrolled'
      })
    )
    if (enrollDocs.length) await Enrollment.insertMany(enrollDocs, { session })

    await session.commitTransaction()
    session.endSession()

    const created = await Course.findById(course[0]._id)
      .populate('createdBy', 'username email')
      .populate('instructors', 'fullName username email')
      .populate('teachingAssistants', 'fullName username email')

    res
      .status(201)
      .json({ status: 'success', message: 'Course created', data: created })
  } catch (err) {
    await session.abortTransaction()
    session.endSession()
    if (err.code === 11000)
      return res
        .status(400)
        .json({ status: 'fail', message: 'Duplicate field' })
    res.status(500).json({ status: 'error', message: err.message })
  }
}

// PUT /api/courses/:id
export const updateCourse = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const { id } = req.params
    const updates = { ...req.body }

    // Prevent changing createdBy via update (unless you intentionally allow it)
    delete updates.createdBy

    // if instructors/teachingAssistants provided -> validate them
    if (updates.instructors) {
      const valid = await validateUserIds(
        Array.isArray(updates.instructors) ? updates.instructors : []
      )
      updates.instructors = valid
    }
    if (updates.teachingAssistants) {
      const valid = await validateUserIds(
        Array.isArray(updates.teachingAssistants)
          ? updates.teachingAssistants
          : []
      )
      updates.teachingAssistants = valid
    }

    // if capacity decreased, ensure not less than current enrolled students
    if (typeof updates.capacity !== 'undefined' && updates.capacity !== null) {
      const currentEnrolled = await Enrollment.countDocuments({
        course: id,
        role: 'student',
        status: 'enrolled'
      }).session(session)
      if (updates.capacity < currentEnrolled) {
        await session.abortTransaction()
        return res.status(400).json({
          status: 'fail',
          message: `Capacity cannot be less than current enrolled (${currentEnrolled})`
        })
      }
    }

    const course = await Course.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
      session
    })
      .populate('createdBy', 'username email')
      .populate('instructors', 'fullName username email')
      .populate('teachingAssistants', 'fullName username email')

    if (!course) {
      await session.abortTransaction()
      return res
        .status(404)
        .json({ status: 'fail', message: 'Course not found' })
    }

    // If instructors/teachingAssistants were added, ensure corresponding Enrollment entries exist
    const enrollOps = []
    if (updates.instructors && updates.instructors.length) {
      updates.instructors.forEach(uid => {
        enrollOps.push({
          updateOne: {
            filter: { user: uid, course: course._id, role: 'instructor' },
            update: {
              $setOnInsert: {
                user: uid,
                course: course._id,
                role: 'instructor',
                status: 'enrolled',
                enrolledAt: new Date()
              }
            },
            upsert: true
          }
        })
      })
    }
    if (updates.teachingAssistants && updates.teachingAssistants.length) {
      updates.teachingAssistants.forEach(uid => {
        enrollOps.push({
          updateOne: {
            filter: { user: uid, course: course._id, role: 'ta' },
            update: {
              $setOnInsert: {
                user: uid,
                course: course._id,
                role: 'ta',
                status: 'enrolled',
                enrolledAt: new Date()
              }
            },
            upsert: true
          }
        })
      })
    }
    if (enrollOps.length) await Enrollment.bulkWrite(enrollOps, { session })

    await session.commitTransaction()
    session.endSession()

    res
      .status(200)
      .json({ status: 'success', message: 'Course updated', data: course })
  } catch (err) {
    await session.abortTransaction()
    session.endSession()
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message)
      return res.status(400).json({ status: 'fail', errors })
    }
    res.status(500).json({ status: 'error', message: err.message })
  }
}

// DELETE /api/courses/:id
export const deleteCourse = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const { id } = req.params
    const deleted = await Course.findByIdAndDelete(id, { session })
    if (!deleted) {
      await session.abortTransaction()
      return res
        .status(404)
        .json({ status: 'fail', message: 'Course not found' })
    }

    await Enrollment.deleteMany({ course: id }, { session })

    await session.commitTransaction()
    session.endSession()

    res.status(200).json({ status: 'success', message: 'Course deleted' })
  } catch (err) {
    await session.abortTransaction()
    session.endSession()
    res.status(500).json({ status: 'error', message: err.message })
  }
}

// GET /api/courses/:id/students  (admin/instructor/ta)
export const listCourseStudents = async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 30 } = req.query
    const skip = (Number(page) - 1) * Number(limit)

    const filter = { course: id, role: 'student', status: 'enrolled' }

    const [rows, total] = await Promise.all([
      Enrollment.find(filter)
        .populate('user', 'fullName username email avatarUrl')
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Enrollment.countDocuments(filter)
    ])

    res.status(200).json({
      status: 'success',
      data: rows,
      meta: { total, page: Number(page), limit: Number(limit) }
    })
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message })
  }
}
