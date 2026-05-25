'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

// Role badge colors
const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  editor: 'bg-green-100 text-green-700',
  writer: 'bg-blue-100 text-blue-700',
  subscriber: 'bg-gray-100 text-gray-600',
}

export default function UsersClient({ initialUsers, currentUserId }) {
  const router = useRouter()

  // Create form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('writer')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState('')

  // Filter state — filter users by role in the table
  const [filterRole, setFilterRole] = useState('all')

  // Handle create user
  const handleCreate = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    setFormSuccess('')

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })

    const data = await res.json()
    setFormLoading(false)

    if (!res.ok) {
      setFormError(data.error)
      return
    }

    // Clear form and show success
    setName('')
    setEmail('')
    setPassword('')
    setRole('writer')
    setFormSuccess(`Account created for ${data.user.email}`)
    router.refresh()
  }

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })

    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error)
    }
  }

  // Handle deactivate / reactivate
  const handleToggleActive = async (userId, currentStatus, userEmail) => {
    const action = currentStatus ? 'deactivate' : 'reactivate'
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${userEmail}?`
    )
    if (!confirmed) return

    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentStatus }),
    })

    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error)
    }
  }

  // Handle delete
  const handleDelete = async (userId, userEmail) => {
    const confirmed = window.confirm(
      `Permanently delete ${userEmail}? This cannot be undone.`
    )
    if (!confirmed) return

    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    const data = await res.json()

    if (res.ok) {
      router.refresh()
    } else {
      alert(data.error)
    }
  }

  // Filter users by selected role
  const filteredUsers = filterRole === 'all'
    ? initialUsers
    : initialUsers.filter((u) => u.role === filterRole)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — create user form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Create New User
            </h2>

            {formError && (
              <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-4">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="bg-green-50 text-green-700 text-xs px-3 py-2 rounded-lg mb-4">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="John Smith"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                >
                  <option value="writer">Writer</option>
                  <option value="editor">Editor</option>
                  <option value="subscriber">Subscriber</option>
                  {/* Admin not available — security */}
                </select>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
              >
                {formLoading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>

          {/* Stats summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mt-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              User Summary
            </h2>
            {['admin', 'editor', 'writer', 'subscriber'].map((r) => {
              const count = initialUsers.filter((u) => u.role === r).length
              return (
                <div
                  key={r}
                  className="flex items-center justify-between py-1.5"
                >
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_COLORS[r]}`}>
                    {r}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {count}
                  </span>
                </div>
              )
            })}
            <div className="border-t border-gray-100 mt-2 pt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">Total</span>
              <span className="text-sm font-bold text-gray-900">
                {initialUsers.length}
              </span>
            </div>
          </div>
        </div>

        {/* Right — users table */}
        <div className="lg:col-span-2">

          {/* Role filter tabs */}
          <div className="flex items-center gap-2 mb-4">
            {['all', 'admin', 'editor', 'writer', 'subscriber'].map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filterRole === r
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {r === 'all' ? 'All' : r}
                {/* Show count next to each role */}
                <span className={`ml-1.5 ${filterRole === r ? 'text-gray-300' : 'text-gray-400'}`}>
                  {r === 'all'
                    ? initialUsers.length
                    : initialUsers.filter((u) => u.role === r).length}
                </span>
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm">
                No users found
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                      Role
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                      Joined
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className={`hover:bg-gray-50 transition-colors ${
                        !user.isActive ? 'opacity-50' : ''
                        // Dim deactivated users visually
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar — first letter of name */}
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {user.name}
                              </p>
                              {/* Mark current user */}
                              {user._id === currentUserId && (
                                <span className="text-xs text-gray-400">
                                  (you)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 hidden md:table-cell">
                        {/* Role dropdown — inline change */}
                        {user._id === currentUserId ? (
                          // Can't change own role
                          <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${ROLE_COLORS[user.role]}`}>
                            {user.role}
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user._id, e.target.value)
                            }
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-gray-400 bg-white"
                          >
                            <option value="subscriber">Subscriber</option>
                            <option value="writer">Writer</option>
                            <option value="editor">Editor</option>
                            {/* Admin not selectable */}
                          </select>
                        )}
                      </td>

                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {user.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-xs text-gray-400">
                          {formatDate(user.createdAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {user._id !== currentUserId && (
                          <div className="flex items-center gap-2 justify-end">
                            {/* Deactivate / Reactivate */}
                            <button
                              onClick={() =>
                                handleToggleActive(
                                  user._id,
                                  user.isActive,
                                  user.email
                                )
                              }
                              className={`text-xs ${
                                user.isActive
                                  ? 'text-yellow-600 hover:text-yellow-800'
                                  : 'text-green-600 hover:text-green-800'
                              }`}
                            >
                              {user.isActive ? 'Deactivate' : 'Reactivate'}
                            </button>

                            {/* Hard delete — only if no posts */}
                            <button
                              onClick={() =>
                                handleDelete(user._id, user.email)
                              }
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        )}
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