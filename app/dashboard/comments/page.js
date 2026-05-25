import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import Comment from '@/models/Comment'
import CommentsClient from '@/components/dashboard/CommentsClient'

export default async function CommentsPage() {
  const session = await getServerSession(authOptions)

  // Writers cannot moderate comments
  if (session.user.role === 'writer' || session.user.role === 'subscriber') {
    redirect('/dashboard')
  }

  await connectDB()

  // Fetch all comments with post and author info
  const comments = await Comment.find()
    .populate('author', 'name email role')
    .populate('postId', 'title slug')
    // postId populated to show which post the comment is on
    .sort({ createdAt: -1 })
    .lean()

  return (
    <CommentsClient
      initialComments={JSON.parse(JSON.stringify(comments))}
    />
  )
}