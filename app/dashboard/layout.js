// Server component — no 'use client' needed
// We can read the session server-side using getServerSession
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

export default async function DashboardLayout({ children }) {
  // Get session on the server before rendering anything
  // If no session — redirect to login immediately
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Subscribers should not be here — send them to their area
  if (session.user.role === 'subscriber') {
    redirect('/reader')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header stays at the top across all dashboard pages */}
      <DashboardHeader user={session.user} />

      <div className="flex flex-1">

        {/* Sidebar stays on the left across all dashboard pages */}
        {/* We pass the role so sidebar can show the right links */}
        <DashboardSidebar role={session.user.role} />

        {/* This is where each page's content renders */}
        {/* It changes based on which route you're on */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>

      </div>
    </div>
  )
}