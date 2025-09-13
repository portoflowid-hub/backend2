import express from 'express';
import { enrollCourse, unenrollCourse, listCourseStudents, getMyEnrollments, updateEnrollment } from '../controller/enrollmentController.js';
import verifyToken from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roleCheck.js';

const router = express.Router();

// student enroll/unenroll (user must be logged in)
router.post('/api/courses/:id/enroll', verifyToken, enrollCourse);
router.delete('/api/courses/:id/enroll', verifyToken, unenrollCourse);

// get my enrollments
router.get('/api/my-enrollments', verifyToken, getMyEnrollments);

// admin/instructor endpoints
router.get('/api/courses/:id/students', verifyToken, authorizeRoles('admin','instructor','ta'), listCourseStudents);
router.put('/api/enrollments/:enrollmentId', verifyToken, authorizeRoles('admin','instructor'), updateEnrollment);

export default router;
