'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import TiptapEditor from '@/components/editor/TiptapEditor'
import TagInput from '@/components/editor/TagInput'

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  // useParams() reads the [id] from the URL

  const { data: session } = useSession()
  const [post, setPost] = useState(null)
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [categories, setCategories] = useState([])
  const [seriesList, setSeriesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  // Load post data, categories, and series on mount
  useEffect(() => {
    const loadData = async () => {
      const [postRes, catRes, seriesRes] = await Promise.all([
        fetch(`/api/posts/${params.id}`),
        fetch('/api/categories'),
        fetch('/api/series'),
      ])

      const postData = await postRes.json()
      const catData = await catRes.json()
      const seriesData = await seriesRes.json()

      if (postData.post) {
        setPost(postData.post)
        setContent(postData.post.content)
        setSelectedTags(postData.post.tags || [])

        // reset() pre-fills the form with existing values
        // This is the react-hook-form way to set initial values
        reset({
          title: postData.post.title,
          excerpt: postData.post.excerpt,
          coverImage: postData.post.coverImage,
          category: postData.post.category?._id,
          series: postData.post.series?._id || '',
          seriesOrder: postData.post.seriesOrder || '',
        })
      }

      setCategories(catData.categories || [])
      setSeriesList(seriesData.series || [])
      setFetchLoading(false)
    }

    loadData()
  }, [params.id, reset])

  const onSubmit = async (data, action) => {
    if (!content || content === '<p></p>') {
      setError('Post content cannot be empty')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch(`/api/posts/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        category: data.category,
        tags: selectedTags.map((t) => t._id),
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

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading post...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Post not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Current status:{' '}
            <span className="capitalize font-medium text-gray-600">
              {post.status}
            </span>
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Same form structure as new post — just pre-filled */}
      <form className="space-y-6">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('title', { required: 'Title is required' })}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Excerpt
          </label>
          <textarea
            {...register('excerpt')}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cover Image URL
          </label>
          <input
            type="url"
            {...register('coverImage')}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Series
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

        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Series Part #
          </label>
          <input
            type="number"
            {...register('seriesOrder')}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <TagInput selectedTags={selectedTags} onChange={setSelectedTags} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <TiptapEditor value={content} onChange={setContent} />
        </div>

        {/* Action buttons — status-aware */}
        <div className="flex flex-wrap items-center gap-3 pt-2">

          <button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, 'draft'))}
            disabled={loading}
            className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Save as Draft
          </button>

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

          {(session?.user?.role === 'admin' || session?.user?.role === 'editor') && (
            <>
              {/* Reject — send back to draft */}
              {post.status === 'pending' && (
                <button
                  type="button"
                  onClick={handleSubmit((data) => onSubmit(data, 'draft'))}
                  disabled={loading}
                  className="px-5 py-2.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
                >
                  Reject
                </button>
              )}

              <button
                type="button"
                onClick={handleSubmit((data) => onSubmit(data, 'published'))}
                disabled={loading}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : post.status === 'published' ? 'Update' : 'Publish'}
              </button>
            </>
          )}

        </div>

      </form>
    </div>
  )
}