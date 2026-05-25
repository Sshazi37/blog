import mongoose from 'mongoose'

const ViewSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  // Store fingerprint hash — IP + User Agent combined
  // We store a hash not the raw IP for privacy
  fingerprint: {
    type: String,
    required: true,
  },
  viewedAt: {
    type: Date,
    default: Date.now,
  },
  country: {
    type: String,
    default: '',
  },
})

// Compound index on postId + fingerprint + viewedAt
// This makes the "did this person already view today" query fast
// Without an index MongoDB scans every document — slow at scale
ViewSchema.index({ postId: 1, fingerprint: 1, viewedAt: 1 })

export default mongoose.models.View || mongoose.model('View', ViewSchema)