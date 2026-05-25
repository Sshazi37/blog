import { formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CommentSection from '@/components/blog/CommentSection'

async function getPost(slug) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/posts/by-slug/${slug}`, {
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export default async function PostPage({ params }) {
  const { slug } = await params
  const data = await getPost(slug)

  if (!data?.post) notFound()

  const { post } = data

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">

      {/* Category + Tags */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {post.category && (
          <Link
            href={`/category/${post.category.slug}`}
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: post.category.color + '20', color: post.category.color }}
          >
            {post.category.name}
          </Link>
        )}
        {post.tags?.map((tag) => (
          <Link
            key={tag._id}
            href={`/tag/${tag.slug}`}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            #{tag.name}
          </Link>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
        {post.title}
      </h1>

      {/* Meta */}
      <div className="flex items-center gap-3 text-sm text-gray-500 mb-8">
        <span>{post.author?.name}</span>
        <span>·</span>
        <span>{formatDate(post.publishedAt)}</span>
        <span>·</span>
        <span>{post.views} views</span>
      </div>

      {/* Series notice */}
      {post.series && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-blue-700 font-medium">
            Part {post.seriesOrder} of{' '}
            <Link href={`/series/${post.series.slug}`} className="underline">
              {post.series.title}
            </Link>
          </p>
        </div>
      )}

      {/* Cover image */}
      {post.coverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-72 object-cover rounded-2xl mb-10"
        />
      )}

      {/* Content — Tiptap outputs HTML, dangerouslySetInnerHTML renders it */}
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Comments */}
      <CommentSection postId={post._id.toString()} />
    </div>
    
  )
}