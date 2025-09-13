import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    password: {
      type: String,
      required: true,
      minlength: 8
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'instructor', 'ta'],
      default: 'user'
    },
    avatarUrl: { type: String, trim: true, default: '' },
    refreshToken: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
)

export default mongoose.model('User', userSchema)
