import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-20 py-10">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-500">© 2025 MyBlog. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/blog" className="text-sm text-gray-500 hover:text-gray-900">Articles</Link>
          <Link href="/search" className="text-sm text-gray-500 hover:text-gray-900">Search</Link>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">Login</Link>
        </div>
      </div>
    </footer>
  )
}