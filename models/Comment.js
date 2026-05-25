import mongoose from 'mongoose'

const CommentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'spam'],
      default: 'pending',
    },
    likes: {
      type: Number,
      default: 0,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema)