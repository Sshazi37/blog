'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Color options for categories
const COLOR_OPTIONS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#64748b', // slate
]

export default function CategoriesClient({ initialCategories }) {
  const router = useRouter()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Edit state — which category is being edited
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState('')

  // Handle create
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError('')

    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, color }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error)
      return
    }

    // Clear form
    setName('')
    setDescription('')
    setColor('#6366f1')

    // Re-fetch server data to show new category in list
    router.refresh()
  }

  // Start editing a category
  const startEdit = (cat) => {
    setEditingId(cat._id)
    setEditName(cat.name)
    setEditDescription(cat.description)
    setEditColor(cat.color)
  }

  // Save edit
  const handleEdit = async (id) => {
    setLoading(true)

    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        description: editDescription,
        color: editColor,
      }),
    })

    setLoading(false)

    if (res.ok) {
      setEditingId(null)
      router.refresh()
    }
  }

  // Handle delete
  const handleDelete = async (id, name, postCount) => {
    if (postCount > 0) {
      alert(`Cannot delete "${name}" — it has ${postCount} posts. Reassign them first.`)
      return
    }

    const confirmed = window.confirm(`Delete category "${name}"? This cannot be undone.`)
    if (!confirmed) return

    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    const data = await res.json()

    if (!res.ok) {
      alert(data.error)
      return
    }

    router.refresh()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Categories</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — create form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Add New Category
            </h2>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="e.g. Web Development"
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
                  placeholder="Short description..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Color
                </label>
                {/* Color picker grid */}
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                {/* Show selected color preview */}
                <div className="flex items-center gap-2 mt-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="text-xs text-gray-500">{color}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Category'}
              </button>
            </form>
          </div>
        </div>

        {/* Right — categories table */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {initialCategories.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm">
                No categories yet. Create one to get started.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                      Posts
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {initialCategories.map((cat) => (
                    <tr key={cat._id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        {editingId === cat._id ? (
                          // Inline edit mode
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-gray-400"
                            />
                            <input
                              type="text"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-gray-400"
                              placeholder="Description..."
                            />
                            {/* Inline color picker */}
                            <div className="flex flex-wrap gap-1.5">
                              {COLOR_OPTIONS.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setEditColor(c)}
                                  className={`w-5 h-5 rounded-full transition-transform ${
                                    editColor === c
                                      ? 'scale-125 ring-2 ring-offset-1 ring-gray-400'
                                      : ''
                                  }`}
                                  style={{ background: c }}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ background: cat.color }}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {cat.name}
                              </p>
                              {cat.description && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {cat.description}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 font-mono mt-0.5">
                                /{cat.slug}
                              </p>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600">
                          {cat.postCount}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          {editingId === cat._id ? (
                            // Save / Cancel buttons in edit mode
                            <>
                              <button
                                onClick={() => handleEdit(cat._id)}
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
                            // Edit / Delete buttons in view mode
                            <>
                              <button
                                onClick={() => startEdit(cat)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(cat._id, cat.name, cat.postCount)
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