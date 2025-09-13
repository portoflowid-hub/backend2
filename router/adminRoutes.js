import express from 'express'
import {
  getAllUsersAdmin,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  loginAdmin,
  refreshTokenAdmin,
  logoutAdmin
} from '../controller/admin/adminController.js'

import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse
} from '../controller/course/courseController.js'

import verifyToken from '../middleware/auth.js'
import { authorizeRoles } from '../middleware/roleCheck.js'

const router = express.Router()
const adminAccess = [verifyToken, authorizeRoles('admin')]
const adminInstructor = [verifyToken, authorizeRoles('admin','instructor')]
const allPeople = [verifyToken, authorizeRoles('admin', 'instructor', 'ta', 'student')]

// User admin routes
router.post('/api/admin/login', loginAdmin)
router.post('/api/admin/refresh-token', refreshTokenAdmin)
router.post('/api/admin/logout', logoutAdmin)
router.get('/api/admin/users', ...adminAccess, getAllUsersAdmin)
router.post('/api/admin/users', ...adminAccess, createUserAdmin)
router.put('/api/admin/users/:id', ...adminAccess, updateUserAdmin)
router.delete('/api/admin/users/:id', ...adminAccess, deleteUserAdmin)

// Course routes
router.get('/api/admin/courses', ...allPeople, getAllCourses)
router.post('/api/admin/courses', ...adminInstructor, createCourse)
router.put('/api/admin/courses/:id', ...adminInstructor, updateCourse)
router.delete('/api/admin/courses/:id', ...adminInstructor, deleteCourse)

export default router
