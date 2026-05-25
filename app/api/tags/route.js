import connectDB from '@/lib/mongodb'
import Tag from '@/models/Tag'
import Post from '@/models/Post'
import AuditLog from '@/models/AuditLog'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSlug } from '@/lib/utils'

// PUT update tag
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { name } = await request.json()
    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    await connectDB()

    const updated = await Tag.findByIdAndUpdate(
      params.id,
      { name: name.trim(), slug: createSlug(name) },
      { new: true }
    )

    if (!updated) {
      return Response.json({ error: 'Tag not found' }, { status: 404 })
    }

    return Response.json({ tag: updated })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// DELETE tag
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectDB()

    // Safety check — warn how many posts use this tag
    const postsUsingTag = await Post.countDocuments({
      tags: params.id,
      // tags is an array — MongoDB checks if params.id exists in that array
    })

    if (postsUsingTag > 0) {
      // For tags we allow deletion but remove the tag from all posts first
      // Tags are less critical than categories — it's OK to remove them
      await Post.updateMany(
        { tags: params.id },
        { $pull: { tags: params.id } }
        // $pull removes a specific value from an array field
        // This cleans up all posts that had this tag
      )
    }

    const tag = await Tag.findByIdAndDelete(params.id)
    if (!tag) {
      return Response.json({ error: 'Tag not found' }, { status: 404 })
    }

    await AuditLog.create({
      performedBy: session.user.id,
      action: 'tag_deleted',
      targetType: 'Tag',
      targetId: params.id,
      details: `Tag "${tag.name}" deleted, removed from ${postsUsingTag} posts`,
    })

    return Response.json({ message: 'Tag deleted', affectedPosts: postsUsingTag })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}