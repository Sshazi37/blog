import connectDB from '@/lib/mongodb'
import View from '@/models/View'
import Post from '@/models/Post'
import User from '@/models/User'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'subscriber') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    // period = 'week', 'lastweek', 'month', '3months', '6months'
    const period = searchParams.get('period') || 'week'

    // --- Calculate date ranges based on period ---

    const now = new Date()

    // Helper to get start of a day (midnight)
    const startOfDay = (date) => {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      return d
    }

    let startDate
    let previousStartDate
    let previousEndDate

    if (period === 'week') {
      // This week — last 7 days
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000)
      // Previous week — 7-14 days ago (for comparison)
      previousStartDate = new Date(now - 14 * 24 * 60 * 60 * 1000)
      previousEndDate = startDate
    } else if (period === 'lastweek') {
      // Exactly last calendar week
      const dayOfWeek = now.getDay()
      startDate = startOfDay(new Date(now - (dayOfWeek + 7) * 24 * 60 * 60 * 1000))
      previousStartDate = startOfDay(new Date(now - (dayOfWeek + 14) * 24 * 60 * 60 * 1000))
      previousEndDate = startDate
    } else if (period === 'month') {
      // Last 30 days
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(now - 60 * 24 * 60 * 60 * 1000)
      previousEndDate = startDate
    } else if (period === '3months') {
      startDate = new Date(now - 90 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(now - 180 * 24 * 60 * 60 * 1000)
      previousEndDate = startDate
    } else if (period === '6months') {
      startDate = new Date(now - 180 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(now - 360 * 24 * 60 * 60 * 1000)
      previousEndDate = startDate
    }

    // --- Writer sees only their own posts' analytics ---
    let authorFilter = {}
    if (session.user.role === 'writer') {
      // Get IDs of posts by this author
      const authorPosts = await Post.find(
        { author: session.user.id },
        '_id'
        // Second argument to find() = projection
        // Only fetch _id field, nothing else — faster
      ).lean()
      const postIds = authorPosts.map((p) => p._id)
      authorFilter = { postId: { $in: postIds } }
    }

    // --- Run all queries in parallel ---
    const [
      currentViews,
      previousViews,
      chartData,
      topPosts,
      totalPosts,
      totalSubscribers,
    ] = await Promise.all([

      // 1. Total views in current period
      View.countDocuments({
        ...authorFilter,
        viewedAt: { $gte: startDate },
      }),

      // 2. Total views in previous period (for % change calculation)
      View.countDocuments({
        ...authorFilter,
        viewedAt: { $gte: previousStartDate, $lte: previousEndDate },
      }),

      // 3. Chart data — views grouped by day
      View.aggregate([
        {
          $match: {
            ...authorFilter,
            viewedAt: { $gte: startDate },
          },
        },
        {
          // $group groups documents together
          // _id defines what to group by
          $group: {
            _id: {
              // $dateToString formats the date as a string
              // This groups all views from the same day together
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$viewedAt',
              },
            },
            // Count documents in each group
            views: { $sum: 1 },
          },
        },
        {
          // Sort by date ascending so chart reads left to right
          $sort: { _id: 1 },
        },
        {
          // Rename _id to date for cleaner frontend usage
          $project: {
            date: '$_id',
            views: 1,
            _id: 0,
          },
        },
      ]),

      // 4. Top 5 posts by views in this period
      View.aggregate([
        {
          $match: {
            ...authorFilter,
            viewedAt: { $gte: startDate },
          },
        },
        {
          // Group by postId and count views per post
          $group: {
            _id: '$postId',
            views: { $sum: 1 },
          },
        },
        {
          $sort: { views: -1 },
        },
        {
          $limit: 5,
        },
        {
          // Join with posts collection to get title and slug
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: '_id',
            as: 'post',
          },
        },
        {
          $addFields: {
            post: { $arrayElemAt: ['$post', 0] },
          },
        },
        {
          $project: {
            views: 1,
            'post.title': 1,
            'post.slug': 1,
            'post.category': 1,
          },
        },
      ]),

      // 5. Total published posts
      Post.countDocuments(
        session.user.role === 'writer'
          ? { author: session.user.id, status: 'published' }
          : { status: 'published' }
      ),

      // 6. Total subscribers — admin only
      session.user.role === 'admin'
        ? User.countDocuments({ role: 'subscriber' })
        : Promise.resolve(null),
    ])

    // --- Calculate percentage change ---
    // How much did views grow compared to previous period
    const viewChange = previousViews === 0
      ? 100
      // If no previous views, 100% growth
      : Math.round(((currentViews - previousViews) / previousViews) * 100)

    return Response.json({
      currentViews,
      previousViews,
      viewChange,
      // Positive = growth, negative = decline
      chartData,
      topPosts,
      totalPosts,
      totalSubscribers,
      period,
    })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}