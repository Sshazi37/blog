'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { timeAgo } from '@/lib/utils'
import Link from 'next/link'

// Status badge colors
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  spam: 'bg-gray-100 text-gray-500',
}

export default function CommentsClient({ initialComments }) {
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState('pending')
  // Default to pending — most important for moderators to see first
  const [loading, setLoading] = useState(false)

  const handleModerate = async (commentId, status) => {
    setLoading(true)

    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    setLoading(false)

    if (res.ok) {
      router.refresh()
    }
  }

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment and all its replies?')) return

    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      router.refresh()
    }
  }

  // Filter comments by selected status
  const filtered = filterStatus === 'all'
    ? initialComments
    : initialComments.filter((c) => c.status === filterStatus)

  // Count by status for filter tabs
  const counts = {
    all: initialComments.length,
    pending: initialComments.filter((c) => c.status === 'pending').length,
    approved: initialComments.filter((c) => c.status === 'approved').length,
    rejected: initialComments.filter((c) => c.status === 'rejected').length,
    spam: initialComments.filter((c) => c.status === 'spam').length,
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Comments</h1>

      {/* Status filter tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {['pending', 'approved', 'rejected', 'spam', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filterStatus === status
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {status}
            <span className={`ml-1.5 ${filterStatus === status ? 'text-gray-300' : 'text-gray-400'}`}>
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl text-center py-16 text-gray-400 text-sm">
            No {filterStatus === 'all' ? '' : filterStatus} comments
          </div>
        ) : (
          filtered.map((comment) => (
            <div
              key={comment._id}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">

                <div className="flex-1 min-w-0">
                  {/* Comment meta */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.author?.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {comment.author?.email}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[comment.status]}`}>
                      {comment.status}
                    </span>
                    {comment.parentId && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        Reply
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>

                  {/* Comment content */}
                  <p className="text-sm text-gray-700 mb-2">
                    {comment.content}
                  </p>

                  {/* Which post */}
                  {comment.postId && (
                    <Link
                      href={`/blog/${comment.postId.slug}`}
                      target="_blank"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      On: {comment.postId.title} ↗
                    </Link>
                  )}
                </div>

                {/* Moderation actions */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {comment.status !== 'approved' && (
                    <button
                      onClick={() => handleModerate(comment._id, 'approved')}
                      disabled={loading}
                      className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  {comment.status !== 'rejected' && (
                    <button
                      onClick={() => handleModerate(comment._id, 'rejected')}
                      disabled={loading}
                      className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Reject
                    </button>
                  )}
                  {comment.status !== 'spam' && (
                    <button
                      onClick={() => handleModerate(comment._id, 'spam')}
                      disabled={loading}
                      className="text-xs bg-gray-50 text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      Spam
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(comment._id)}
                    disabled={loading}
                    className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5"
                  >
                    Delete
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}