'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TagsClient({ initialTags }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    setName('')
    router.refresh()
  }

  const handleEdit = async (id) => {
    setLoading(true)

    const res = await fetch(`/api/tags/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })

    setLoading(false)

    if (res.ok) {
      setEditingId(null)
      router.refresh()
    }
  }

  const handleDelete = async (id, name, postCount) => {
    const message = postCount > 0
      ? `Delete tag "${name}"? It will be removed from ${postCount} posts.`
      : `Delete tag "${name}"?`

    const confirmed = window.confirm(message)
    if (!confirmed) return

    const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' })

    if (res.ok) {
      router.refresh()
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tags</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Create form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Add New Tag
            </h2>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="e.g. JavaScript"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Tag'}
              </button>
            </form>
          </div>
        </div>

        {/* Tags table */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {initialTags.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm">
                No tags yet.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                      Tag
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                      Posts
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {initialTags.map((tag) => (
                    <tr key={tag._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        {editingId === tag._id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-gray-400"
                          />
                        ) : (
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              #{tag.name}
                            </span>
                            <span className="text-xs text-gray-400 font-mono ml-2">
                              {tag.slug}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600">
                          {tag.postCount}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          {editingId === tag._id ? (
                            <>
                              <button
                                onClick={() => handleEdit(tag._id)}
                                disabled={loading}
                                className="text-xs text-green-600 hover:text-green-800 font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-xs text-gray-400 hover:text-gray-600"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(tag._id)
                                  setEditName(tag.name)
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(tag._id, tag.name, tag.postCount)
                                }
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}