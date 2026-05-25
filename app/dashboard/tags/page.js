import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import Tag from '@/models/Tag'
import TagsClient from '@/components/dashboard/TagsClient'

export default async function TagsPage() {
  const session = await getServerSession(authOptions)

  if (session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  await connectDB()

  // Tags already have postCount cached on the model
  // No need for aggregation — just sort by most used
  const tags = await Tag.find()
    .sort({ postCount: -1 })
    .lean()

  return (
    <TagsClient
      initialTags={JSON.parse(JSON.stringify(tags))}
    />
  )
}