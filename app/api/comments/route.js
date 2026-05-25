import connectDB from '@/lib/mongodb'
import Comment from '@/models/Comment'
import Notification from '@/models/Notification'
import Post from '@/models/Post'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET comments for a specific post
// /api/comments?postId=xxx
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return Response.json({ error: 'postId is required' }, { status: 400 })
    }

    // Only fetch approved top-level comments
    // parentId: null means top-level comment, not a reply
    const comments = await Comment.find({
      postId,
      status: 'approved',
      parentId: null,
    })
      .populate('author', 'name avatar role')
      .sort({ createdAt: -1 })
      .lean()

    // For each top-level comment, fetch its approved replies
    // We do this separately instead of one big nested query
    // because MongoDB doesn't support recursive population natively
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({
          parentId: comment._id,
          status: 'approved',
        })
          .populate('author', 'name avatar role')
          .sort({ createdAt: 1 })
          // Replies sorted oldest first — natural conversation flow
          .lean()

        return { ...comment, replies }
      })
    )

    return Response.json({ comments: commentsWithReplies })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// POST create new comment or reply
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)

    // Must be logged in to comment
    if (!session) {
      return Response.json(
        { error: 'You must be logged in to comment' },
        { status: 401 }
      )
    }

    await connectDB()

    const { postId, content, parentId } = await request.json()

    if (!postId || !content?.trim()) {
      return Response.json(
        { error: 'Post ID and content are required' },
        { status: 400 }
      )
    }

    if (content.trim().length < 2) {
      return Response.json(
        { error: 'Comment is too short' },
        { status: 400 }
      )
    }

    // Check post exists
    const post = await Post.findById(postId)
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    // If this is a reply, check parent comment exists
    if (parentId) {
      const parentComment = await Comment.findById(parentId)
      if (!parentComment) {
        return Response.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // Admins and editors comments auto-approve
    // Writers and subscribers go to pending for moderation
    const autoApprove = ['admin', 'editor'].includes(session.user.role)

    const comment = await Comment.create({
      postId,
      author: session.user.id,
      content: content.trim(),
      parentId: parentId || null,
      status: autoApprove ? 'approved' : 'pending',
    })

    // Populate author for the response
    await comment.populate('author', 'name avatar role')

    // Send notification to post author about new comment
    // But don't notify if they commented on their own post
    if (post.author.toString() !== session.user.id) {
      await Notification.create({
        recipient: post.author,
        type: 'new_comment',
        message: `${session.user.name} commented on "${post.title}"`,
        link: `/blog/${post.slug}#comment-${comment._id}`,
        relatedPost: post._id,
        relatedComment: comment._id,
      })
    }

    // If this is a reply, also notify the parent comment author
    if (parentId) {
      const parentComment = await Comment.findById(parentId)
      if (
        parentComment &&
        parentComment.author.toString() !== session.user.id
      ) {
        await Notification.create({
          recipient: parentComment.author,
          type: 'comment_reply',
          message: `${session.user.name} replied to your comment`,
          link: `/blog/${post.slug}#comment-${comment._id}`,
          relatedPost: post._id,
          relatedComment: comment._id,
        })
      }
    }

    return Response.json(
      {
        comment,
        // Tell frontend if it's pending so we can show a message
        pending: !autoApprove,
      },
      { status: 201 }
    )
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}