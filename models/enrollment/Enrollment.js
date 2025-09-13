import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Types.ObjectId, ref: 'Course', required: true, index: true },
  role: { type: String, enum: ['student','ta','instructor'], default: 'student' },
  status: { type: String, enum: ['pending','active','cancelled','completed'], default: 'active' },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  grade: { type: String, default: null },
  metadata: { type: Object, default: {} } // place for paymentId, coupon, etc.
}, {
  timestamps: true
});

// Prevent duplicate enrollments for same user-course-role
enrollmentSchema.index({ user: 1, course: 1, role: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);
