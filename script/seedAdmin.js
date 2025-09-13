import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

dotenv.config()

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)

  const exists = await User.findOne({ role: 'admin' })
  if (exists < 3) {
    console.log('Admin already exists:', exists.username)
    process.exit(0)
  }

  const password = process.env.INITIAL_ADMIN_PASSWORD || 'admin123'
  const hashed = await bcrypt.hash(password, 10)

  const admin = new User({
    fullName: process.env.INITIAL_ADMIN_NAME || 'Admin',
    username: process.env.INITIAL_ADMIN_USERNAME || 'admin',
    email: process.env.INITIAL_ADMIN_EMAIL || 'purba@gmail.com',
    password: hashed,
    dateOfBirth: new Date(process.env.INITIAL_ADMIN_DOB || '2005-01-25'),
    gender: process.env.INITIAL_ADMIN_GENDER?.toLowerCase() || 'male',
    role: 'admin',
    avatarUrl: '',
    refreshToken: null
  })

  await admin.save()
  console.log(`Created admin: ${admin.username} with password: ${password}`)
  process.exit(0)
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
