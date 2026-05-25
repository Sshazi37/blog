'use client'

import { useState, useEffect, useRef } from 'react'

export default function TagInput({ selectedTags, onChange }) {
  // selectedTags = array of tag objects already chosen: [{_id, name}]
  // onChange = function to call when tags change

  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [allTags, setAllTags] = useState([])
  const debounceRef = useRef(null)

  // Load all tags once on mount for filtering
  useEffect(() => {
    fetch('/api/tags')
      .then((r) => r.json())
      .then((data) => setAllTags(data.tags || []))
  }, [])

  // Filter suggestions as user types
  useEffect(() => {
    if (input.length < 1) {
      setSuggestions([])
      return
    }

    // Filter tags that match input and aren't already selected
    const filtered = allTags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(input.toLowerCase()) &&
        !selectedTags.find((t) => t._id === tag._id)
        // Exclude already selected tags from suggestions
    )
    setSuggestions(filtered)
    setShowSuggestions(true)
  }, [input, allTags, selectedTags])

  const addTag = (tag) => {
    // Add tag to selected list and notify parent
    onChange([...selectedTags, tag])
    setInput('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const removeTag = (tagId) => {
    // Remove tag from selected list
    onChange(selectedTags.filter((t) => t._id !== tagId))
  }

  return (
    <div>
      {/* Selected tags displayed as removable pills */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag._id}
            className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full"
          >
            #{tag.name}
            <button
              type="button"
              onClick={() => removeTag(tag._id)}
              className="text-gray-400 hover:text-gray-700 ml-1"
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* Tag search input */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => input && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          // setTimeout gives time for the click on a suggestion to fire
          // before the blur hides the dropdown
          placeholder="Search and add tags..."
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-gray-400"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg z-10 overflow-hidden">
            {suggestions.map((tag) => (
              <button
                key={tag._id}
                type="button"
                onMouseDown={() => addTag(tag)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                #{tag.name}
                <span className="text-xs text-gray-400 ml-2">
                  {tag.postCount} posts
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}