'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'

// Single comment — handles display, reply, edit, delete
function CommentItem({ comment, postId, onCommentAdded, onCommentDeleted }) {
  const { data: session } = useSession()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  const handleReply = async () => {
    if (!replyContent.trim()) return
    setReplyLoading(true)

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        content: replyContent,
        // parentId connects this reply to the parent comment
        parentId: comment._id,
      }),
    })

    const data = await res.json()
    setReplyLoading(false)

    if (res.ok) {
      setReplyContent('')
      setShowReplyForm(false)
      onCommentAdded(data.pending)
    }
  }

  const handleEdit = async () => {
    const res = await fetch(`/api/comments/${comment._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    })

    if (res.ok) {
      setIsEditing(false)
      // Refresh comments list
      onCommentAdded(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return

    const res = await fetch(`/api/comments/${comment._id}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      onCommentDeleted(comment._id)
    }
  }

  // Check if current user can delete this comment
  const canDelete =
    session &&
    (session.user.id === comment.author?._id ||
      ['admin', 'editor'].includes(session.user.role))

  const canEdit = session && session.user.id === comment.author?._id

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0 mt-0.5">
        {comment.author?.name?.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        {/* Comment header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            {comment.author?.name}
          </span>
          {/* Role badge for admin/editor/writer */}
          {comment.author?.role !== 'subscriber' && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded capitalize">
              {comment.author?.role}
            </span>
          )}
          <span className="text-xs text-gray-400">
            {timeAgo(comment.createdAt)}
          </span>
          {/* Show edited label if comment was edited */}
          {comment.editedAt && (
            <span className="text-xs text-gray-400 italic">(edited)</span>
          )}
        </div>

        {/* Comment content — edit mode or view mode */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">
            {comment.content}
          </p>
        )}

        {/* Comment actions */}
        <div className="flex items-center gap-3 mt-2">
          {/* Reply button — only for logged in users */}
          {session && !isEditing && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Reply
            </button>
          )}
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Edit
            </button>
          )}
          {canDelete && !isEditing && (
            <button
              onClick={handleDelete}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-3 space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              placeholder={`Reply to ${comment.author?.name}...`}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReply}
                disabled={replyLoading || !replyContent.trim()}
                className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                {replyLoading ? 'Posting...' : 'Post Reply'}
              </button>
              <button
                onClick={() => setShowReplyForm(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Replies — indented under parent */}
        {comment.replies?.length > 0 && (
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-100">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                postId={postId}
                onCommentAdded={onCommentAdded}
                onCommentDeleted={onCommentDeleted}
              />
              // CommentItem calling itself = recursion
              // This handles infinite nesting depth automatically
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Main comment section component
export default function CommentSection({ postId }) {
  const { data: session } = useSession()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [pendingMessage, setPendingMessage] = useState(false)

  // Load comments when component mounts
  const loadComments = async () => {
    const res = await fetch(`/api/comments?postId=${postId}`)
    const data = await res.json()
    setComments(data.comments || [])
    setLoading(false)
  }

  useEffect(() => {
    loadComments()
  }, [postId])

  const handleSubmit = async () => {
    if (!newComment.trim()) return
    setSubmitLoading(true)
    setPendingMessage(false)

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, content: newComment }),
    })

    const data = await res.json()
    setSubmitLoading(false)

    if (res.ok) {
      setNewComment('')
      if (data.pending) {
        // Show message that comment is awaiting moderation
        setPendingMessage(true)
      } else {
        // Auto-approved (admin/editor) — reload comments
        loadComments()
      }
    }
  }

  // Called when a comment or reply is added
  const handleCommentAdded = (isPending) => {
    if (isPending) {
      setPendingMessage(true)
    } else {
      loadComments()
    }
  }

  // Called when a comment is deleted — remove from local state
  // without refetching all comments
  const handleCommentDeleted = (commentId) => {
    setComments((prev) =>
      prev.filter((c) => c._id !== commentId)
    )
  }

  return (
    <div className="mt-16 pt-10 border-t border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-8">
        Comments
        {comments.length > 0 && (
          <span className="text-base font-normal text-gray-400 ml-2">
            ({comments.length})
          </span>
        )}
      </h2>

      {/* New comment form */}
      {session ? (
        <div className="mb-10">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                placeholder="Share your thoughts..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                {pendingMessage && (
                  <p className="text-xs text-yellow-600">
                    ✓ Comment submitted — awaiting moderation
                  </p>
                )}
                <div className="ml-auto">
                  <button
                    onClick={handleSubmit}
                    disabled={submitLoading || !newComment.trim()}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
                  >
                    {submitLoading ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Not logged in — show login prompt
        <div className="mb-10 bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
          <p className="text-sm text-gray-600 mb-3">
            Sign in to join the conversation
          </p>
          <Link
            href="/login"
            className="inline-block bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700"
          >
            Sign In
          </Link>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded animate-pulse w-32" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-8">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              onCommentAdded={handleCommentAdded}
              onCommentDeleted={handleCommentDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}