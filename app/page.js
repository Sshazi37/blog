import Link from 'next/link'
import { formatDate } from '@/lib/utils'

async function getFeaturedPosts() {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/posts?limit=6`, {
    cache: 'no-store',
  })
  const data = await res.json()
  return data.posts || []
}

async function getCategories() {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/categories`, {
    cache: 'no-store',
  })
  const data = await res.json()
  return data.categories || []
}

export default async function HomePage() {
  const [posts, categories] = await Promise.all([
    getFeaturedPosts(),
    getCategories(),
  ])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* Hero */}
      <div className="text-center mb-14">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Welcome to MyBlog</h1>
        <p className="text-xl text-gray-500 max-w-xl mx-auto">
          Thoughts, tutorials, and stories worth reading.
        </p>
        <Link
          href="/blog"
          className="inline-block mt-6 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
        >
          Browse all articles
        </Link>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/category/${cat.slug}`}
                className="px-4 py-2 rounded-full text-sm font-medium border border-gray-200 hover:border-gray-400 transition-colors"
                style={{ borderColor: cat.color, color: cat.color }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Latest Posts */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Latest articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link key={post._id} href={`/blog/${post.slug}`} className="group block">
              <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-5">
                  {post.category && (
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ background: post.category.color + '20', color: post.category.color }}
                    >
                      {post.category.name}
                    </span>
                  )}
                  <h3 className="text-base font-semibold text-gray-900 mt-2 mb-2 group-hover:text-blue-600 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-xs text-gray-400">{formatDate(post.publishedAt)}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{post.views} views</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}