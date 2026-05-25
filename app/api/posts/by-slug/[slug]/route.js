import connectDB from '@/lib/mongodb'
import Post from '@/models/Post'
import View from '@/models/View'
import crypto from 'crypto'
import '@/models/User'
import '@/models/Category'
import '@/models/Tag'
import '@/models/Series'
// crypto is built into Node.js — no install needed
// We use it to hash the fingerprint so we never store raw IPs

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    await connectDB()

    const post = await Post.findOne({
      slug,
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

    // --- Unique view tracking ---

    // Get IP address from request headers
    // x-forwarded-for is set by Vercel/proxies with the real IP
    // fallback to direct connection IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '0.0.0.0'

    // Get browser fingerprint
    const userAgent = request.headers.get('user-agent') || ''

    // Combine IP + User Agent into one string then hash it
    // SHA-256 produces a fixed-length string from any input
    // This way we never store the actual IP — just a hash of it
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${ip}-${userAgent}`)
      .digest('hex')

    // Check if this fingerprint already viewed this post in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const alreadyViewed = await View.findOne({
      postId: post._id,
      fingerprint,
      // Only look at views from the last 24 hours
      viewedAt: { $gte: oneDayAgo },
    })

    // Only count view if not already viewed in last 24 hours
    if (!alreadyViewed) {
      console.log('Logging new view for:', post.slug)
      // Log the view document
      await View.create({
        postId: post._id,
        fingerprint,
        viewedAt: new Date(),
        // Get country from Vercel's geo header if available
        // This works automatically when deployed on Vercel
        country: request.headers.get('x-vercel-ip-country') || '',
      })

      // Increment the cached view counter on the post
      await Post.findByIdAndUpdate(post._id, { $inc: { views: 1 } })
    }

    return Response.json({ post })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}