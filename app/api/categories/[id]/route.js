import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import Post from '@/models/Post'
import AuditLog from '@/models/AuditLog'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSlug } from '@/lib/utils'

// PUT update category
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { name, description, color } = await request.json()
    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    await connectDB()

    const updated = await Category.findByIdAndUpdate(
      params.id,
      {
        name: name.trim(),
        // Regenerate slug when name changes
        slug: createSlug(name),
        description: description?.trim() || '',
        color: color || '#6366f1',
      },
      { new: true }
      // new: true returns the updated document
    )

    if (!updated) {
      return Response.json({ error: 'Category not found' }, { status: 404 })
    }

    return Response.json({ category: updated })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// DELETE category
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectDB()

    // Safety check — don't delete a category that has posts
    // This would orphan those posts with no category
    const postsUsingCategory = await Post.countDocuments({
      category: params.id,
    })

    if (postsUsingCategory > 0) {
      return Response.json(
        {
          error: `Cannot delete — ${postsUsingCategory} post(s) are using this category. Reassign them first.`,
        },
        { status: 400 }
      )
    }

    const category = await Category.findByIdAndDelete(params.id)
    if (!category) {
      return Response.json({ error: 'Category not found' }, { status: 404 })
    }

    // Log the deletion
    await AuditLog.create({
      performedBy: session.user.id,
      action: 'category_deleted',
      targetType: 'Category',
      targetId: params.id,
      details: `Category "${category.name}" deleted`,
    })

    return Response.json({ message: 'Category deleted' })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}