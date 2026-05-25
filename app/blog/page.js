import Link from 'next/link'
import { formatDate } from '@/lib/utils'

async function getPosts(page = 1) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/posts?page=${page}&limit=10`, {
    cache: 'no-store',
  })
  return res.json()
}

export default async function BlogPage({ searchParams }) {
  const page = parseInt(searchParams.page) || 1
  const { posts, pagination } = await getPosts(page)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">All Articles</h1>

      <div className="space-y-6">
        {posts?.map((post) => (
          <Link key={post._id} href={`/blog/${post.slug}`} className="group block">
            <div className="flex gap-5 p-5 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div>
                {post.category && (
                  <span className="text-xs font-medium" style={{ color: post.category.color }}>
                    {post.category.name}
                  </span>
                )}
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mt-1 mb-1">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  <span>{post.author?.name}</span>
                  <span>·</span>
                  <span>{formatDate(post.publishedAt)}</span>
                  <span>·</span>
                  <span>{post.views} views</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/blog?page=${p}`}
              className={`px-4 py-2 rounded-lg text-sm border ${
                p === page
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}