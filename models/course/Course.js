import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  price:       { type: Number, default: 0 },
  currency:    { type: String, default: 'USD' },
  createdBy:   { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  instructors: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
  teachingAssistants: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
  capacity:    { type: Number, default: null }, // null = unlimited
  tags:        [{ type: String, trim: true }],
  category:    { type: String, trim: true, default: '' },
  level:       { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },
  durationHours: { type: Number, default: 0 },
  language:    { type: String, default: 'English' },
  imageUrl:    { type: String, trim: true, default: '' },
  isPublished: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// text index for search (title + description + tags)
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

// virtual: shortDescription
courseSchema.virtual('shortDescription').get(function() {
  return this.description ? (this.description.slice(0, 200) + (this.description.length > 200 ? '…' : '')) : '';
});

courseSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'course'
});

const Course = mongoose.model('Course', courseSchema);
export default Course;
