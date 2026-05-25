import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Post from '@/models/Post'
import Category from '@/models/Category'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import DeletePostButton from '@/components/dashboard/DeletePostButton'
import PublishPostButton from '@/components/dashboard/PublishPostButton'

// Status badge component — color coded by status
function StatusBadge({ status }) {
  const colors = {
    draft: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-700',
    published: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${colors[status]}`}>
      {status}
    </span>
  )
}

export default async function PostsPage() {
  const session = await getServerSession(authOptions)
  await connectDB()

  // Writers only see their own posts
  // Admins and editors see all posts
  const query = session.user.role === 'writer'
    ? { author: session.user.id }
    : {}

  const posts = await Post.find(query)
    .populate('author', 'name')
    .populate('category', 'name color')
    .sort({ createdAt: -1 })
    .lean()

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
        <Link
          href="/dashboard/posts/new"
          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          + New Post
        </Link>
      </div>

      {/* Posts table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">No posts yet</p>
            <Link href="/dashboard/posts/new" className="text-sm text-blue-600 hover:underline">
              Write your first post
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Author
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Category
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Views
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Date
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((post) => (
                <tr key={post._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {post.title}
                    </p>
                    {post.excerpt && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {post.excerpt}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-600">{post.author?.name}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {post.category && (
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{
                          background: post.category.color + '20',
                          color: post.category.color,
                        }}
                      >
                        {post.category.name}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-gray-600">
                      {post.views.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-xs text-gray-400">
                      {formatDate(post.createdAt)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {/* Edit button */}
                      <Link
                        href={`/dashboard/posts/${post._id}/edit`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>

                      {/* View on blog (published only) */}
                      {post.status === 'published' && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-xs text-gray-400 hover:text-gray-700"
                        >
                          View ↗
                        </Link>
                      )}

                      {post.status !== 'published' && (
                      <PublishPostButton
                        postId={post._id.toString()}
                        role={session.user.role}
                        status={post.status}
                      />
                      )}

                      {/* Delete button — client component because it needs onClick */}
                      <DeletePostButton
                        postId={post._id.toString()}
                        role={session.user.role}
                        status={post.status}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}