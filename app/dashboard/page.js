import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Post from '@/models/Post'
import User from '@/models/User'
import Comment from '@/models/Comment'
import View from '@/models/View'
import Link from 'next/link'
import MiniChart from '@/components/dashboard/MiniChart'

// Stat card with trend indicator
function StatCard({ label, value, sub, trend }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {trend !== undefined && (
        <p className={`text-xs font-medium mt-1 ${
          trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'
        }`}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}% vs last week
        </p>
      )}
      {sub && !trend && (
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      )}
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  await connectDB()

  const postQuery = session.user.role === 'writer'
    ? { author: session.user.id }
    : {}

  const now = new Date()
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000)

  const [
    totalPosts,
    publishedPosts,
    pendingPosts,
    draftPosts,
    pendingComments,
    totalUsers,
    viewsThisWeek,
    viewsLastWeek,
    chartData,
  ] = await Promise.all([
    Post.countDocuments(postQuery),
    Post.countDocuments({ ...postQuery, status: 'published' }),
    Post.countDocuments({ ...postQuery, status: 'pending' }),
    Post.countDocuments({ ...postQuery, status: 'draft' }),
    Comment.countDocuments({ status: 'pending' }),
    session.user.role === 'admin'
      ? User.countDocuments()
      : Promise.resolve(null),

    // Views this week
    View.countDocuments({ viewedAt: { $gte: sevenDaysAgo } }),

    // Views last week — for trend calculation
    View.countDocuments({
      viewedAt: { $gte: fourteenDaysAgo, $lte: sevenDaysAgo },
    }),

    // Last 7 days chart data grouped by day
    View.aggregate([
      { $match: { viewedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$viewedAt' },
          },
          views: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', views: 1, _id: 0 } },
    ]),
  ])

  // Calculate week-over-week trend
  const weekTrend = viewsLastWeek === 0
    ? 100
    : Math.round(((viewsThisWeek - viewsLastWeek) / viewsLastWeek) * 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good to see you, {session.user.name} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening this week
          </p>
        </div>
        {/* Quick link to full analytics */}
        {session.user.role === 'admin' && (
          <Link
            href="/dashboard/analytics"
            className="text-sm text-blue-600 hover:underline"
          >
            Full analytics →
          </Link>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Views This Week"
          value={viewsThisWeek.toLocaleString()}
          trend={weekTrend}
        />
        <StatCard
          label="Published Posts"
          value={publishedPosts}
          sub={`${draftPosts} drafts`}
        />
        <StatCard
          label="Pending Review"
          value={pendingPosts}
          sub="Waiting for approval"
        />
        <StatCard
          label="Pending Comments"
          value={pendingComments}
          sub="Need moderation"
        />
      </div>

      {/* Mini chart — last 7 days */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Views — Last 7 Days
        </h2>
        {/* MiniChart is a client component because Recharts needs the browser */}
        <MiniChart data={chartData} />
      </div>

      {/* Admin-only row */}
      {session.user.role === 'admin' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={totalUsers} sub="All roles" />
          <StatCard label="Total Posts" value={totalPosts} sub="All statuses" />
        </div>
      )}
    </div>
  )
}