'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

// Period filter options
const PERIODS = [
  { label: 'This Week', value: 'week' },
  { label: 'Last Week', value: 'lastweek' },
  { label: 'This Month', value: 'month' },
  { label: '3 Months', value: '3months' },
  { label: '6 Months', value: '6months' },
]

export default function AnalyticsClient({ role }) {
  const [period, setPeriod] = useState('week')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch analytics whenever period changes
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      const res = await fetch(`/api/analytics?period=${period}`)
      const result = await res.json()
      setData(result)
      setLoading(false)
    }

    fetchAnalytics()
  }, [period])
  // Dependency array — re-runs whenever period changes

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

        {/* Period filter buttons */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        // Skeleton loading state — shows while data is fetching
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl h-32 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Total views with trend */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">Total Views</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.currentViews?.toLocaleString()}
              </p>
              {data?.viewChange !== undefined && (
                <p className={`text-xs font-medium mt-1 ${
                  data.viewChange > 0
                    ? 'text-green-600'
                    : data.viewChange < 0
                    ? 'text-red-500'
                    : 'text-gray-400'
                }`}>
                  {data.viewChange > 0 ? '↑' : data.viewChange < 0 ? '↓' : '→'}{' '}
                  {Math.abs(data.viewChange)}% vs previous period
                </p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">Published Posts</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.totalPosts?.toLocaleString()}
              </p>
            </div>

            {/* Subscribers — admin only */}
            {role === 'admin' && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm text-gray-500 mb-1">Total Subscribers</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data?.totalSubscribers?.toLocaleString()}
                </p>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-sm text-gray-500 mb-1">Prev Period Views</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.previousViews?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Bar chart — views per day */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-5">
              Views Over Time
            </h2>
            {data?.chartData?.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                No view data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      try {
                        // Shorter format for longer periods
                        const fmt = ['3months', '6months'].includes(period)
                          ? 'MMM d'
                          : 'EEE d'
                          // EEE = Mon, Tue, Wed etc
                        return format(parseISO(value), fmt)
                      } catch {
                        return value
                      }
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                    }}
                    labelFormatter={(value) => {
                      try {
                        return format(parseISO(value), 'MMMM d, yyyy')
                      } catch {
                        return value
                      }
                    }}
                    formatter={(value) => [value, 'Views']}
                  />
                  <Bar
                    dataKey="views"
                    fill="#111827"
                    radius={[4, 4, 0, 0]}
                    // Rounded top corners on bars
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top performing posts */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                Top Posts This Period
              </h2>
            </div>
            {data?.topPosts?.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No data yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data?.topPosts?.map((item, index) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    {/* Rank number */}
                    <span className="text-lg font-bold text-gray-200 w-6 flex-shrink-0">
                      {index + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {item.post?.title || 'Untitled'}
                      </p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        /{item.post?.slug}
                      </p>
                    </div>

                    {/* View count with bar visualization */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-100 rounded-full h-1.5 hidden md:block">
                        <div
                          className="bg-gray-900 h-1.5 rounded-full"
                          style={{
                            // Width proportional to top post's views
                            width: `${(item.views / data.topPosts[0].views) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-16 text-right">
                        {item.views.toLocaleString()} views
                      </span>
                    </div>

                    {item.post?.slug && (
                      <Link
                        href={`/blog/${item.post.slug}`}
                        target="_blank"
                        className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        ↗
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}