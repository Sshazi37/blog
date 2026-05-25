import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import AuditLog from '@/models/AuditLog'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET all users — admin only
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectDB()

    const users = await User.find()
      // Never return password hash to the frontend
      // .select('-password') means exclude the password field
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()

    return Response.json({ users })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST create new user — admin only
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { name, email, password, role } = await request.json()

    if (!name || !email || !password || !role) {
      return Response.json(
        { error: 'Name, email, password and role are required' },
        { status: 400 }
      )
    }

    // Admin cannot create another admin from the UI
    // Prevents privilege escalation — new admins should be
    // created directly in the database or by a super admin
    if (role === 'admin') {
      return Response.json(
        { error: 'Cannot create admin users from the dashboard' },
        { status: 403 }
      )
    }

    if (!['writer', 'editor', 'subscriber'].includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 })
    }

    await connectDB()

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return Response.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      isActive: true,
    })

    // Log the creation
    await AuditLog.create({
      performedBy: session.user.id,
      action: 'user_created',
      targetType: 'User',
      targetId: user._id,
      details: `Created ${role} account for ${email}`,
    })

    // Return user without password
    return Response.json(
      {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}