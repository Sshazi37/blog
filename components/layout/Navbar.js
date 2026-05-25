'use client'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  const getDashboardLink = () => {
    if (!session) return '/login'
    if (session.user.role === 'subscriber') return '/reader'
    return '/dashboard'
  }

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
          MyBlog
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/blog" className="text-gray-600 hover:text-gray-900 text-sm">
            Articles
          </Link>
          <Link href="/search" className="text-gray-600 hover:text-gray-900 text-sm">
            Search
          </Link>
          {session ? (
            <div className="flex items-center gap-4">
              <Link
                href={getDashboardLink()}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}