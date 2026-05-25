import connectDB from '@/lib/mongodb'
import Post from '@/models/Post'
import Tag from '@/models/Tag'
import AuditLog from '@/models/AuditLog'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSlug } from '@/lib/utils'

// GET single post by ID — for loading edit form
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const post = await Post.findById(params.id)
      .populate('category', 'name slug')
      .populate('tags', 'name slug _id')
      .populate('series', 'title slug')
      .lean()

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    // Writers can only see their own posts
    if (
      session.user.role === 'writer' &&
      post.author.toString() !== session.user.id
    ) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json({ post })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// PUT — update post (edit content or change status)
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const post = await Post.findById(params.id)
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    // Writers can only edit their own posts
    if (
      session.user.role === 'writer' &&
      post.author.toString() !== session.user.id
    ) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, excerpt, coverImage, category, tags, series, seriesOrder, status } = body

    // Track old tags to update postCount correctly
    const oldTags = post.tags.map((t) => t.toString())
    const newTags = tags || []

    // Find tags that were removed and tags that were added
    const removedTags = oldTags.filter((t) => !newTags.includes(t))
    const addedTags = newTags.filter((t) => !oldTags.includes(t))

    // Decrement postCount for removed tags
    if (removedTags.length > 0) {
      await Tag.updateMany(
        { _id: { $in: removedTags } },
        { $inc: { postCount: -1 } }
      )
    }

    // Increment postCount for newly added tags
    if (addedTags.length > 0) {
      await Tag.updateMany(
        { _id: { $in: addedTags } },
        { $inc: { postCount: 1 } }
      )
    }

    // If post is being published for the first time, set publishedAt
    const isBeingPublished = status === 'published' && post.status !== 'published'

    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      params.id,
      {
        title: title?.trim(),
        // Regenerate slug only if title changed
        ...(title !== post.title && { slug: createSlug(title) }),
        content,
        excerpt: excerpt?.trim(),
        coverImage,
        category,
        tags: newTags,
        series: series || null,
        seriesOrder: seriesOrder || null,
        status,
        // Only set publishedAt when first published, never overwrite it
        ...(isBeingPublished && { publishedAt: new Date() }),
      },
      { new: true }
      // new: true returns the updated document, not the old one
    )

    // Log this action to AuditLog if status changed
    if (status !== post.status) {
      await AuditLog.create({
        performedBy: session.user.id,
        action: status === 'published' ? 'post_published' : 'post_rejected',
        targetType: 'Post',
        targetId: post._id,
        details: `Status changed from ${post.status} to ${status}`,
      })
    }

    return Response.json({ post: updatedPost })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// DELETE post
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const post = await Post.findById(params.id)
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    // Writers can only delete their own drafts
    // They cannot delete published posts
    if (session.user.role === 'writer') {
      if (post.author.toString() !== session.user.id) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (post.status === 'published') {
        return Response.json(
          { error: 'Writers cannot delete published posts' },
          { status: 403 }
        )
      }
    }

    await Post.findByIdAndDelete(params.id)

    // Decrement postCount for all tags this post had
    if (post.tags.length > 0) {
      await Tag.updateMany(
        { _id: { $in: post.tags } },
        { $inc: { postCount: -1 } }
      )
    }

    // Log the deletion
    await AuditLog.create({
      performedBy: session.user.id,
      action: 'post_deleted',
      targetType: 'Post',
      targetId: post._id,
      details: `"${post.title}" deleted`,
    })

    return Response.json({ message: 'Post deleted successfully' })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}