import mongoose from 'mongoose'

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'post_approved',
        'post_rejected',
        'post_published',
        'new_comment',
        'comment_reply',
        'new_series_part',
        'series_completed',
        'new_subscriber',
        'admin_notice',
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: '',
    },
    read: {
      type: Boolean,
      default: false,
    },
    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    relatedComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    relatedSeries: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Series',
      default: null,
    },
  },
  { timestamps: true }
)

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)