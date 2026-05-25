'use client'
// Client component because we highlight the active link
// using usePathname() which is a browser hook

import Link from 'next/link'
import { usePathname } from 'next/navigation'
// usePathname returns the current URL path
// e.g. '/dashboard/posts' — we use this to highlight the active link

// Define all nav items with which roles can see each one
// This is the single source of truth for sidebar navigation
const navItems = [
  {
    label: 'Overview',
    href: '/dashboard',
    // icon as SVG path — keeps component self-contained, no icon library needed
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 7h18M3 12h18M3 17h18" />
      </svg>
    ),
    // roles array — which roles can see this item
    roles: ['admin', 'writer', 'editor'],
  },
  {
    label: 'Posts',
    href: '/dashboard/posts',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    roles: ['admin', 'writer', 'editor'],
  },
  {
    label: 'Comments',
    href: '/dashboard/comments',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    // Writers can't moderate comments — only editors and admins
    roles: ['admin', 'editor'],
  },
  {
    label: 'Categories',
    href: '/dashboard/categories',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 8V5a2 2 0 012-2z" />
      </svg>
    ),
    roles: ['admin'],
  },
  {
    label: 'Tags',
    href: '/dashboard/tags',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
    roles: ['admin', 'editor'],
  },
  {
    label: 'Series',
    href: '/dashboard/series',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    roles: ['admin', 'editor'],
  },
  {
    label: 'Media',
    href: '/dashboard/media',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    roles: ['admin', 'writer', 'editor'],
  },
  {
    label: 'Newsletter',
    href: '/dashboard/newsletter',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    roles: ['admin'],
  },
  {
    label: 'Subscribers',
    href: '/dashboard/subscribers',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    roles: ['admin'],
  },
  {
    label: 'Users',
    href: '/dashboard/users',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    // Only admin can manage users
    roles: ['admin'],
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    roles: ['admin'],
  },
  {
    label: 'Audit Log',
    href: '/dashboard/audit',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    roles: ['admin'],
  },
]

export default function DashboardSidebar({ role }) {
  const pathname = usePathname()

  // Filter nav items to only those the current role can see
  const visibleItems = navItems.filter((item) => item.roles.includes(role))

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0 hidden md:flex flex-col">

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          // Check if this link is the currently active page
          // exact match for /dashboard, startsWith for nested routes
          // e.g. /dashboard/posts/new should still highlight 'Posts'
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  // Active link — dark background
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  // Inactive — subtle hover
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom of sidebar — role badge */}
      <div className="px-4 py-4 border-t border-gray-100">
        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
          role === 'admin'
            ? 'bg-purple-100 text-purple-700'
            : role === 'editor'
            ? 'bg-green-100 text-green-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {role}
        </span>
      </div>

    </aside>
  )
}