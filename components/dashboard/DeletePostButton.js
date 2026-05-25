'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeletePostButton({ postId, role, status }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Writers cannot delete published posts — hide button entirely
  if (role === 'writer' && status === 'published') return null

  const handleDelete = async () => {
    // Always confirm destructive actions
    const confirmed = window.confirm('Are you sure you want to delete this post? This cannot be undone.')
    if (!confirmed) return

    setLoading(true)

    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
    })

    if (res.ok) {
      // router.refresh() re-runs the server component
      // without doing a full page reload
      // The posts table will re-fetch and show updated data
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to delete post')
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {loading ? '...' : 'Delete'}
    </button>
  )
}