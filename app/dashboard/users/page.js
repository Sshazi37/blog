import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import UsersClient from '@/components/dashboard/UsersClient'

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  await connectDB()

  const users = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .lean()

  return (
    <UsersClient
      initialUsers={JSON.parse(JSON.stringify(users))}
      currentUserId={session.user.id}
    />
  )
}