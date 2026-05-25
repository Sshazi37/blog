import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import Post from '@/models/Post'

export default async function CategoryPage({ params }) {
  await connectDB()

  const category = await Category.findOne({ slug: params.slug }).lean()
  if (!category) notFound()

  const posts = await Post.find({ category: category._id, status: 'published' })
    .populate('author', 'name')
    .sort({ publishedAt: -1 })
    .lean()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <span
          className="text-sm font-medium px-3 py-1 rounded-full"
          style={{ background: category.color + '20', color: category.color }}
        >
          Category
        </span>
        <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-500">{category.description}</p>
        )}
        <p className="text-sm text-gray-400 mt-2">{posts.length} articles</p>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Link key={post._id} href={`/blog/${post.slug}`} className="group block">
            <div className="p-5 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
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