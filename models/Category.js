import mongoose from 'mongoose'

const CategorySchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#000000',
    },
  },
  { timestamps: true }
)

export default mongoose.models.Category || mongoose.model('Category', CategorySchema)