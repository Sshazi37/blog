'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import TagInput from '@/components/editor/TagInput'

export default function NewPostPage() {
  const router = useRouter()
  const { data: session } = useSession()

  const [content, setContent] = useState('')
  // Content managed separately from react-hook-form
  // because Tiptap is not a standard HTML input

  const [selectedTags, setSelectedTags] = useState([])
  const [categories, setCategories] = useState([])
  const [seriesList, setSeriesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm()

  // Load categories and series for the dropdowns
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))

    fetch('/api/series')
      .then((r) => r.json())
      .then((d) => setSeriesList(d.series || []))
  }, [])

  const onSubmit = async (data, action) => {
    // action = 'draft', 'pending', or 'published'
    // We pass this as a parameter so one form handles all three buttons

    if (!content || content === '<p></p>') {
      setError('Post content cannot be empty')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        category: data.category,
        tags: selectedTags.map((t) => t._id),
        // Send only the IDs to the API, not full tag objects
        series: data.series || null,
        seriesOrder: data.seriesOrder ? parseInt(data.seriesOrder) : null,
        status: action,
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(result.error)
      return
    }

    router.push('/dashboard/posts')
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Post</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form className="space-y-6">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('title', { required: 'Title is required' })}
            className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 ${
              errors.title ? 'border-red-300' : 'border-gray-200'
            }`}
            placeholder="Enter post title..."
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Excerpt
            <span className="text-gray-400 font-normal ml-1">
              (short description shown in post cards)
            </span>
          </label>
          <textarea
            {...register('excerpt')}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none"
            placeholder="Brief description of the post..."
          />
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover Image URL
          </label>
          <input
            type="url"
            {...register('coverImage')}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Category + Series row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 bg-white ${
                errors.category ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Series
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <select
              {...register('series')}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">Not part of a series</option>
              {seriesList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Series order */}
        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Series Part #
          </label>
          <input
            type="number"
            {...register('seriesOrder')}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
            placeholder="1"
            min="1"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <TagInput
            selectedTags={selectedTags}
            onChange={setSelectedTags}
          />
        </div>

        {/* Rich Text Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <TiptapEditor
            value={content}
            onChange={setContent}
            // onChange updates our content state every keystroke
          />
        </div>

        {/* Action buttons — different for writer vs admin/editor */}
        <div className="flex items-center gap-3 pt-2">

          {/* Save draft — available to all */}
          <button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, 'draft'))}
            disabled={loading}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Save Draft
          </button>

          {/* Submit for review — writers only */}
          {session?.user?.role === 'writer' && (
            <button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, 'pending'))}
              disabled={loading}
              className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 disabled:opacity-50"
            >
              Submit for Review
            </button>
          )}

          {/* Publish directly — admin and editor only */}
          {(session?.user?.role === 'admin' || session?.user?.role === 'editor') && (
            <button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, 'published'))}
              disabled={loading}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Now'}
            </button>
          )}

        </div>

      </form>
    </div>
  )
}