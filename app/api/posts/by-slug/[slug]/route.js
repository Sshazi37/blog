import connectDB from '@/lib/mongodb'
import Post from '@/models/Post'
import View from '@/models/View'

export async function GET(request, { params }) {
  try {
    await connectDB()

    const post = await Post.findOne({
      slug: params.slug,
      status: 'published',
    })
      .populate('author', 'name avatar bio')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug')
      .populate('series', 'title slug totalParts')
      .lean()

    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 })
    }

    // Log this view
    await View.create({ postId: post._id })

    // Increment view counter on post
    await Post.findByIdAndUpdate(post._id, { $inc: { views: 1 } })

    return Response.json({ post })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}