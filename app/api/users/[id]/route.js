import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import AuditLog from '@/models/AuditLog'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// PUT — update role or reactivate user
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const { role, isActive } = await request.json()

    await connectDB()

    // Prevent admin from changing their own role
    // An admin accidentally demoting themselves would
    // lock them out of the dashboard
    if (id === session.user.id) {
      return Response.json(
        { error: 'You cannot change your own role or status' },
        { status: 400 }
      )
    }

    const user = await User.findById(id)
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Build update object — only update fields that were sent
    const updates = {}
    if (role && role !== user.role) {
      // Validate role
      if (!['writer', 'editor', 'subscriber'].includes(role)) {
        return Response.json({ error: 'Invalid role' }, { status: 400 })
      }
      updates.role = role
    }
    if (typeof isActive === 'boolean') {
      updates.isActive = isActive
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).select('-password')

    // Log role change
    if (updates.role) {
      await AuditLog.create({
        performedBy: session.user.id,
        action: 'user_role_changed',
        targetType: 'User',
        targetId: id,
        details: `Role changed from ${user.role} to ${updates.role}`,
      })
    }

    // Log deactivation/reactivation
    if (typeof updates.isActive === 'boolean') {
      await AuditLog.create({
        performedBy: session.user.id,
        action: 'user_deleted',
        // Reusing closest action from enum
        targetType: 'User',
        targetId: id,
        details: updates.isActive
          ? `Account reactivated for ${user.email}`
          : `Account deactivated for ${user.email}`,
      })
    }

    return Response.json({ user: updatedUser })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// DELETE — hard delete only if user has no posts
// Otherwise deactivate instead
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    // Cannot delete yourself
    if (id === session.user.id) {
      return Response.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findById(id)
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Import Post here to check if user has posts
    const { default: Post } = await import('@/models/Post')
    const postCount = await Post.countDocuments({ author: id })

    if (postCount > 0) {
      // Cannot hard delete — deactivate instead
      return Response.json(
        {
          error: `Cannot delete — this user has ${postCount} posts. Deactivate their account instead.`,
        },
        { status: 400 }
      )
    }

    await User.findByIdAndDelete(id)

    await AuditLog.create({
      performedBy: session.user.id,
      action: 'user_deleted',
      targetType: 'User',
      targetId: id,
      details: `User ${user.email} permanently deleted`,
    })

    return Response.json({ message: 'User deleted' })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}