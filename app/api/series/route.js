import connectDB from '@/lib/mongodb'
import Series from '@/models/Series'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSlug } from '@/lib/utils'

export async function GET() {
  try {
    await connectDB()
    const series = await Series.find()
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .lean()
    return Response.json({ series })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === 'subscriber') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, coverImage, status } = await request.json()
    if (!title) {
      return Response.json({ error: 'Title is required' }, { status: 400 })
    }

    await connectDB()

    const series = await Series.create({
      title: title.trim(),
      slug: createSlug(title),
      description: description || '',
      coverImage: coverImage || '',
      author: session.user.id,
      status: status || 'ongoing',
    })

    return Response.json({ series }, { status: 201 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}