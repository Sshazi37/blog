import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    await connectDB()

    const existing = await User.findOne({ email: 'writer@blog.com' })
    if (existing) {
      return Response.json({ message: 'Writer user already exists' })
    }

    const hashedPassword = await bcrypt.hash('writer123', 10)

    const user = await User.create({
      name: 'Writer',
      email: 'writer@blog.com',
      password: hashedPassword,
      role: 'writer',
    })

    return Response.json({ message: 'Writer user created', user: user.email })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}