import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    // Parse the JSON body sent from the register form
    const body = await request.json()
    const { name, email, password } = body

    // Basic server-side validation
    // Never trust client-side validation alone — 
    // anyone can send a request directly to your API
    if (!name || !email || !password) {
      return Response.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return Response.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    await connectDB()

    // Check if this email is already registered
    const existingUser = await User.findOne({ 
      email: email.toLowerCase() 
    })

    if (existingUser) {
      return Response.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash the password before saving
    // 10 = salt rounds — industry standard balance of security vs speed
    // NEVER save a plain text password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user — role defaults to 'subscriber' 
    // as defined in the User model schema
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      // role not passed — defaults to 'subscriber' from schema
    })

    // Return success but never return the password hash
    return Response.json(
      {
        message: 'Account created successfully',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
      // 201 = Created (more specific than 200 = OK)
      // Use correct HTTP status codes — it's professional practice
    )

  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}