import connectDB from '@/lib/mongodb'
import Series from '@/models/Series'
import Post from '@/models/Post'
import AuditLog from '@/models/AuditLog'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSlug } from '@/lib/utils'

// PUT update series
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'subscriber') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { title, description, coverImage, status } = await request.json()
    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 })
    }

    await connectDB()

    // Count how many posts are in this series
    // to keep totalParts accurate
    const partCount = await Post.countDocuments({
      series: params.id,
      status: 'published',
    })

    const updated = await Series.findByIdAndUpdate(
      params.id,
      {
        title: title.trim(),
        slug: createSlug(title),
        description: description?.trim() || '',
        coverImage: coverImage || '',
        status: status || 'ongoing',
        // Sync totalParts with actual published post count
        totalParts: partCount,
      },
      { new: true }
    )

    if (!updated) {
      return Response.json({ error: 'Series not found' }, { status: 404 })
    }

    return Response.json({ series: updated })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// DELETE series
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    await connectDB()

    // Check how many posts belong to this series
    const postsInSeries = await Post.countDocuments({ series: params.id })

    if (postsInSeries > 0) {
      return Response.json(
        {
          error: `Cannot delete — ${postsInSeries} post(s) belong to this series. Remove them from the series first.`,
        },
        { status: 400 }
      )
    }

    const series = await Series.findByIdAndDelete(params.id)
    if (!series) {
      return Response.json({ error: 'Series not found' }, { status: 404 })
    }

    await AuditLog.create({
      performedBy: session.user.id,
      action: 'series_created',
      // Note: reusing closest action type from enum
      targetType: 'Series',
      targetId: params.id,
      details: `Series "${series.title}" deleted`,
    })

    return Response.json({ message: 'Series deleted' })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}