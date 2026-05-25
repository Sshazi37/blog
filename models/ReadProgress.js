import mongoose from 'mongoose'

const ReadProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Series',
      default: null,
    },
    bookmarked: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

export default mongoose.models.ReadProgress || mongoose.model('ReadProgress', ReadProgressSchema)