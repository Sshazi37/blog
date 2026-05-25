'use client'
// Client component because we use signOut which is a browser action
// and we manage notification dropdown state

import { signOut } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'

export default function DashboardHeader({ user }) {
  // Controls the user dropdown menu (logout button)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">

      {/* Left — Logo / Brand */}
      <Link href="/" className="text-lg font-bold text-gray-900">
        MyBlog
        {/* Small label showing which panel this is */}
        <span className="ml-2 text-xs font-normal text-gray-400">
          Admin Panel
        </span>
      </Link>

      {/* Right — notifications + user menu */}
      <div className="flex items-center gap-4">

        {/* View public blog button */}
        <Link
          href="/blog"
          target="_blank"
          className="text-sm text-gray-500 hover:text-gray-900 hidden md:block"
        >
          View Blog ↗
        </Link>

        {/* User menu dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
          >
            {/* Avatar — first letter of name as fallback */}
            <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-medium">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-none">
                {user.name}
              </p>
              {/* Show role badge so user always knows their permission level */}
              <p className="text-xs text-gray-400 capitalize mt-0.5">
                {user.role}
              </p>
            </div>
            {/* Chevron icon — rotates when menu is open */}
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {userMenuOpen && (
            <>
              {/* Invisible overlay — clicking outside closes the menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </header>
  )
}