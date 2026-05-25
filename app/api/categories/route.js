import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSlug } from '@/lib/utils'

// GET all categories — public, used by forms and public pages
export async function GET() {
  try {
    await connectDB()
    const categories = await Category.find()
      .sort({ name: 1 })
      // Sort alphabetically by name
      .lean()
    return Response.json({ categories })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST create new category — admin only
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    // Only admins can create categories
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { name, description, color } = await request.json()

    if (!name) {
      return Response.json({ error: 'Category name is required' }, { status: 400 })
    }

    await connectDB()

    // Generate slug from name
    const slug = createSlug(name)

    // Check for duplicate slug
    const existing = await Category.findOne({ slug })
    if (existing) {
      return Response.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      )
    }

    const category = await Category.create({
      name: name.trim(),
      slug,
      description: description?.trim() || '',
      // Default color if none provided
      color: color || '#6366f1',
    })

    return Response.json({ category }, { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}