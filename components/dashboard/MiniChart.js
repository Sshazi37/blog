'use client'
// Must be client component — Recharts renders in the browser

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
// date-fns for formatting the date labels on the X axis

export default function MiniChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
        No view data yet
      </div>
    )
  }

  return (
    // ResponsiveContainer makes the chart fill its parent width
    // height 200 = fixed height in pixels
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>

        {/* Gradient fill under the line */}
        <defs>
          <linearGradient id="viewGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#111827" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#111827" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          // Format date string "2025-05-20" to "May 20"
          tickFormatter={(value) => {
            try {
              return format(parseISO(value), 'MMM d')
            } catch {
              return value
            }
          }}
        />

        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          // Only show whole numbers on Y axis
          allowDecimals={false}
        />

        <Tooltip
          contentStyle={{
            fontSize: 12,
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
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

        <Area
          type="monotone"
          // monotone = smooth curved line, not jagged
          dataKey="views"
          stroke="#111827"
          strokeWidth={2}
          fill="url(#viewGradient)"
          // Reference the gradient defined in <defs>
          dot={false}
          // Hide dots on each data point for cleaner look
          activeDot={{ r: 4, fill: '#111827' }}
          // Show dot only on hover
        />

      </AreaChart>
    </ResponsiveContainer>
  )
}