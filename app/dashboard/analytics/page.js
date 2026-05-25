// app/dashboard/analytics/page.js
import AnalyticsClient from '@/components/dashboard/AnalyticsClient'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  // Writers see limited analytics, redirect subscribers
  if (session.user.role === 'subscriber') {
    redirect('/reader')
  }

  return (
    <AnalyticsClient role={session.user.role} />
  )
}