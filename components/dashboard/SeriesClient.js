'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

export default function SeriesClient({ initialSeries }) {
  const router = useRouter()

  // Create form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [seriesStatus, setSeriesStatus] = useState('ongoing')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  // editData holds all editable fields for the currently editing row
  // Using one object instead of separate states for each field
  // because series has more fields than category/tag

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    setError('')

    const res = await fetch('/api/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        coverImage,
        status: seriesStatus,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    // Clear form
    setTitle('')
    setDescription('')
    setCoverImage('')
    setSeriesStatus('ongoing')
    router.refresh()
  }

  const startEdit = (s) => {
    setEditingId(s._id)
    // Store all editable fields in one object
    setEditData({
      title: s.title,
      description: s.description || '',
      coverImage: s.coverImage || '',
      status: s.status,
    })
  }

  const handleEdit = async (id) => {
    setLoading(true)

    const res = await fetch(`/api/series/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData),
    })

    setLoading(false)

    if (res.ok) {
      setEditingId(null)
      router.refresh()
    }
  }

  const handleDelete = async (id, title, totalParts) => {
    if (totalParts > 0) {
      alert(`Cannot delete "${title}" — it has ${totalParts} posts. Remove posts from this series first.`)
      return
    }

    if (!window.confirm(`Delete series "${title}"?`)) return

    const res = await fetch(`/api/series/${id}`, { method: 'DELETE' })

    if (res.ok) {
      router.refresh()
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Series</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Create form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              New Series
            </h2>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="e.g. Next.js from Zero"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
                  placeholder="What is this series about..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={seriesStatus}
                  onChange={(e) => setSeriesStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Series'}
              </button>
            </form>
          </div>
        </div>

        {/* Series list */}
        <div className="lg:col-span-2 space-y-4">
          {initialSeries.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl text-center py-16 text-gray-500 text-sm">
              No series yet. Create one to group related posts together.
            </div>
          ) : (
            initialSeries.map((s) => (
              <div
                key={s._id}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                {editingId === s._id ? (
                  // Edit mode
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) =>
                        setEditData({ ...editData, title: e.target.value })
                      }
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    />
                    <textarea
                      value={editData.description}
                      onChange={(e) =>
                        setEditData({ ...editData, description: e.target.value })
                      }
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
                    />
                    <input
                      type="url"
                      value={editData.coverImage}
                      onChange={(e) =>
                        setEditData({ ...editData, coverImage: e.target.value })
                      }
                      placeholder="Cover image URL..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                    />
                    <select
                      value={editData.status}
                      onChange={(e) =>
                        setEditData({ ...editData, status: e.target.value })
                      }
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                    >
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(s._id)}
                        disabled={loading}
                        className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex gap-4">
                    {s.coverImage && (
                      <img
                        src={s.coverImage}
                        alt={s.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {s.title}
                          </h3>
                          {s.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {s.description}
                            </p>
                          )}
                        </div>
                        {/* Status badge */}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                          s.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {s.status}
                        </span>
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-gray-400">
                          {s.publishedParts}/{s.totalParts} parts published
                        </span>
                        {s.author && (
                          <span className="text-xs text-gray-400">
                            by {s.author.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(s.createdAt)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => startEdit(s)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(s._id, s.title, s.totalParts)
                          }
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}