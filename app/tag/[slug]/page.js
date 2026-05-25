import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import connectDB from '@/lib/mongodb'
import Tag from '@/models/Tag'
import Post from '@/models/Post'

export default async function TagPage({ params }) {
  await connectDB()

  const tag = await Tag.findOne({ slug: params.slug }).lean()
  if (!tag) notFound()

  const posts = await Post.find({ tags: tag._id, status: 'published' })
    .populate('author', 'name')
    .populate('category', 'name slug color')
    .sort({ publishedAt: -1 })
    .lean()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">#{tag.name}</h1>
        <p className="text-sm text-gray-400">{posts.length} articles</p>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Link key={post._id} href={`/blog/${post.slug}`} className="group block">
            <div className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              {post.category && (
                <span className="text-xs font-medium" style={{ color: post.category.color }}>
                  {post.category.name}
                </span>
              )}
              <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 mt-1 mb-1">
                {post.title}
              </h2>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{post.author?.name}</span>
                <span>·</span>
                <span>{formatDate(post.publishedAt)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}