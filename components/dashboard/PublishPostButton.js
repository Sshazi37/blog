'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PublishPostButton({ postId, role, status }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Writers cannot delete published posts — hide button entirely
  if (role === 'writer' && status === 'published') return null

  const handlePublish = async () => {

    setLoading(true)

    const res = await fetch(`/api/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'params': postId, // Pass postId as a header since we can't use URL params in fetch
      },
      body: JSON.stringify({ status: 'published' }),
    })

    if (res.ok) {
      // router.refresh() re-runs the server component
      // without doing a full page reload
      // The posts table will re-fetch and show updated data
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to publish post')
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handlePublish}
      disabled={loading}
      className="text-xs text-green-500 hover:text-green-700 disabled:opacity-50"
    >
      {loading ? '...' : 'Publish'}
    </button>
  )
}