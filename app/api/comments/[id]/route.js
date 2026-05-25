import connectDB from '@/lib/mongodb'
import Comment from '@/models/Comment'
import Notification from '@/models/Notification'
import Post from '@/models/Post'
import AuditLog from '@/models/AuditLog'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PUT — moderate comment (approve/reject/spam)
// Also handles editing own comment
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    await connectDB()

    const comment = await Comment.findById(id)
    if (!comment) {
      return Response.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Two types of PUT requests:
    // 1. Moderation (admin/editor changing status)
    // 2. Edit (user editing their own comment content)

    if (body.status) {
      // Moderation — only admin and editor
      if (!['admin', 'editor'].includes(session.user.role)) {
        return Response.json({ error: 'Not authorized to moderate' }, { status: 403 })
      }

      if (!['approved', 'rejected', 'spam'].includes(body.status)) {
        return Response.json({ error: 'Invalid status' }, { status: 400 })
      }

      const updated = await Comment.findByIdAndUpdate(
        id,
        { status: body.status },
        { new: true }
      ).populate('author', 'name email')

      // Log moderation action
      await AuditLog.create({
        performedBy: session.user.id,
        action: body.status === 'approved'
          ? 'comment_approved'
          : 'comment_deleted',
        targetType: 'Comment',
        targetId: id,
        details: `Comment status set to ${body.status}`,
      })

      // If approved, notify the comment author
      if (body.status === 'approved') {
        const post = await Post.findById(comment.postId)
        await Notification.create({
          recipient: comment.author,
          type: 'new_comment',
          // Reusing closest type — comment was approved
          message: 'Your comment was approved and is now visible',
          link: post ? `/blog/${post.slug}#comment-${id}` : '/blog',
          relatedComment: id,
        })
      }

      return Response.json({ comment: updated })
    }

    if (body.content) {
      // Edit own comment content
      // Users can only edit their own comments
      if (comment.author.toString() !== session.user.id) {
        return Response.json({ error: 'You can only edit your own comments' }, { status: 403 })
      }

      const updated = await Comment.findByIdAndUpdate(
        id,
        {
          content: body.content.trim(),
          // Track that this comment was edited
          editedAt: new Date(),
          // Go back to pending after edit — needs re-moderation
          status: ['admin', 'editor'].includes(session.user.role)
            ? 'approved'
            : 'pending',
        },
        { new: true }
      ).populate('author', 'name avatar role')

      return Response.json({ comment: updated })
    }

    return Response.json({ error: 'Nothing to update' }, { status: 400 })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// DELETE comment
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await connectDB()

    const comment = await Comment.findById(id)
    if (!comment) {
      return Response.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Allow deletion if: admin, editor, or the comment's own author
    const canDelete =
      ['admin', 'editor'].includes(session.user.role) ||
      comment.author.toString() === session.user.id

    if (!canDelete) {
      return Response.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Also delete all replies to this comment
    await Comment.deleteMany({ parentId: id })

    await Comment.findByIdAndDelete(id)

    return Response.json({ message: 'Comment deleted' })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}