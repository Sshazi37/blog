'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default function SearchPage() {
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categoryInput, setCategoryInput] = useState('')
  const [categorySuggestions, setCategorySuggestions] = useState([])
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const searchTimeout = useRef(null)

  // Load all categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
  }, [])

  // Filter category suggestions as user types
  useEffect(() => {
    if (categoryInput.length < 1) {
      setCategorySuggestions([])
      return
    }
    const filtered = categories.filter((c) =>
      c.name.toLowerCase().includes(categoryInput.toLowerCase())
    )
    setCategorySuggestions(filtered)
  }, [categoryInput, categories])

  // Search posts with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    clearTimeout(searchTimeout.current)
    setLoading(true)

    searchTimeout.current = setTimeout(async () => {
      const params = new URLSearchParams({ q: searchQuery })
      if (selectedCategory) params.set('category', selectedCategory._id)

      const res = await fetch(`/api/search?${params}`)
      const data = await res.json()
      setResults(data.posts || [])
      setLoading(false)
    }, 400)
  }, [searchQuery, selectedCategory])

  const selectCategory = (cat) => {
    setSelectedCategory(cat)
    setCategoryInput(cat.name)
    setShowCategorySuggestions(false)
  }

  const clearCategory = () => {
    setSelectedCategory(null)
    setCategoryInput('')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Search</h1>

      <div className="flex flex-col md:flex-row gap-3 mb-8">

        {/* Category input with suggestions */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Filter by category..."
            value={categoryInput}
            onChange={(e) => {
              setCategoryInput(e.target.value)
              setShowCategorySuggestions(true)
              if (!e.target.value) clearCategory()
            }}
            onFocus={() => setShowCategorySuggestions(true)}
            onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
          />
          {selectedCategory && (
            <button
              onClick={clearCategory}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
          {showCategorySuggestions && categorySuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg z-10 overflow-hidden">
              {categorySuggestions.map((cat) => (
                <button
                  key={cat._id}
                  onMouseDown={() => selectCategory(cat)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: cat.color }}
                  />
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Article search input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={
              selectedCategory
                ? `Search in ${selectedCategory.name}...`
                : 'Search all articles...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
          />
          {loading && (
            <span className="absolute right-3 top-3 text-xs text-gray-400">
              Searching...
            </span>
          )}
        </div>
      </div>

      {/* Selected category badge */}
      {selectedCategory && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">Searching in:</span>
          <span
            className="text-xs font-medium px-3 py-1 rounded-full"
            style={{
              background: selectedCategory.color + '20',
              color: selectedCategory.color,
            }}
          >
            {selectedCategory.name}
          </span>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {results.map((post) => (
          <Link key={post._id} href={`/blog/${post.slug}`} className="group block">
            <div className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div>
                {post.category && (
                  <span
                    className="text-xs font-medium"
                    style={{ color: post.category.color }}
                  >
                    {post.category.name}
                  </span>
                )}
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 mt-1">
                  {post.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-1 mt-1">{post.excerpt}</p>
                <span className="text-xs text-gray-400 mt-1 block">
                  {formatDate(post.publishedAt)}
                </span>
              </div>
            </div>
          </Link>
        ))}

        {searchQuery.length >= 2 && results.length === 0 && !loading && (
          <p className="text-center text-gray-500 text-sm py-10">
            No articles found for "{searchQuery}"
            {selectedCategory ? ` in ${selectedCategory.name}` : ''}
          </p>
        )}
      </div>
    </div>
  )
}