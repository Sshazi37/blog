import slugify from 'slugify'

export function createSlug(text) {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  })
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`
  return formatDate(date)
}

export function truncate(text, length = 150) {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

