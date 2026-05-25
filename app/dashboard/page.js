// Server component — fetches real data from database
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Post from '@/models/Post'
import User from '@/models/User'
import Comment from '@/models/Comment'
import View from '@/models/View'

// A simple reusable stat card component defined in the same file
// No need for a separate file for something this small
function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  await connectDB()

  // Build query based on role
  // Writers only see their own post stats
  // Admins and editors see everything
  const postQuery = session.user.role === 'writer'
    ? { author: session.user.id }
    : {}

  // Run all count queries in parallel for performance
  const [
    totalPosts,
    publishedPosts,
    pendingPosts,
    draftPosts,
    totalComments,
    pendingComments,
    totalUsers,
    viewsThisWeek,
  ] = await Promise.all([
    Post.countDocuments(postQuery),
    Post.countDocuments({ ...postQuery, status: 'published' }),
    Post.countDocuments({ ...postQuery, status: 'pending' }),
    Post.countDocuments({ ...postQuery, status: 'draft' }),

    // Comments — writers don't manage comments so always show all
    Comment.countDocuments({ status: 'pending' }),

    Comment.countDocuments({ status: 'pending' }),

    // Users — only admin needs this
    session.user.role === 'admin' ? User.countDocuments() : Promise.resolve(null),

    // Views this week — count View documents from last 7 days
    View.countDocuments({
      viewedAt: {
        // $gte = greater than or equal to
        // Date.now() - 7 days in milliseconds
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Good to see you, {session.user.name} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's what's happening on your blog
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Posts"
          value={totalPosts}
          sub={`${publishedPosts} published`}
        />
        <StatCard
          label="Pending Review"
          value={pendingPosts}
          sub="Waiting for approval"
        />
        <StatCard
          label="Drafts"
          value={draftPosts}
          sub="Not submitted yet"
        />
        <StatCard
          label="Views This Week"
          value={viewsThisWeek.toLocaleString()}
          // toLocaleString formats 1000 as 1,000
          sub="Across all posts"
        />
      </div>

      {/* Second row — admin only sees users and comments */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Comments"
          value={pendingComments}
          sub="Need moderation"
        />
        {session.user.role === 'admin' && (
          <StatCard
            label="Total Users"
            value={totalUsers}
            sub="All roles"
          />
        )}
      </div>
    </div>
  )
}