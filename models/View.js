import mongoose from 'mongoose'

const ViewSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
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

export default mongoose.models.View || mongoose.model('View', ViewSchema)