import mongoose from 'mongoose'

const TagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    postCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

export default mongoose.models.Tag || mongoose.model('Tag', TagSchema)