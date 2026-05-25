import mongoose from 'mongoose'

const AuditLogSchema = new mongoose.Schema({
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: [
      'user_created',
      'user_deleted',
      'user_role_changed',
      'post_published',
      'post_deleted',
      'post_rejected',
      'comment_deleted',
      'comment_approved',
      'category_created',
      'category_deleted',
      'tag_deleted',
      'series_created',
      'newsletter_sent',
      'subscriber_deleted',
    ],
    required: true,
  },
  targetType: {
    type: String,
    enum: ['User', 'Post', 'Comment', 'Category', 'Tag', 'Series', 'Newsletter', 'Subscriber'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  details: {
    type: String,
    default: '',
  },
  performedAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema)