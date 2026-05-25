import connectDB from '@/lib/mongodb'
import Post from '@/models/Post'

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const skip = (page - 1) * limit

    const query = { status: 'published' }
    if (category) query.category = category
    if (tag) query.tags = tag

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('author', 'name avatar')
        .populate('category', 'name slug color')
        .populate('tags', 'name slug')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(query),
    ])

    return Response.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}


// import connectDB from '@/lib/mongodb'
// import Post from '@/models/Post'
import Tag from '@/models/Tag'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSlug } from '@/lib/utils'

// ... keep your existing GET function here ...

export async function POST(request) {
  try {
    // Only logged-in writers, editors, admins can create posts
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role === 'subscriber') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    // 401 = not logged in at all
    // 403 = logged in but not allowed — important difference

    const body = await request.json()
    const { title, content, excerpt, coverImage, category, tags, series, seriesOrder, status } = body

    if (!title || !content || !category) {
      return Response.json(
        { error: 'Title, content and category are required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Generate slug from title
    // Add timestamp suffix to avoid duplicate slugs
    // "My Post" + 1716234567 = "my-post-1716234567"
    let slug = createSlug(title)
    const existingSlug = await Post.findOne({ slug })
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    // Build the post object
    const postData = {
      title: title.trim(),
      slug,
      content,
      excerpt: excerpt?.trim() || '',
      coverImage: coverImage || '',
      author: session.user.id,
      category,
      tags: tags || [],
      series: series || null,
      seriesOrder: seriesOrder || null,
      // Writers can only save as draft or submit as pending
      // They cannot directly publish
      status: session.user.role === 'writer'
        ? (status === 'pending' ? 'pending' : 'draft')
        : status || 'draft',
      // Admins and editors can publish directly
      publishedAt: status === 'published' ? new Date() : null,
    }

    const post = await Post.create(postData)

    // Increment postCount on each selected tag
    // $inc on multiple documents at once using $in
    if (tags && tags.length > 0) {
      await Tag.updateMany(
        { _id: { $in: tags } },
        // $in = match any document whose _id is in this array
        { $inc: { postCount: 1 } }
      )
    }

    return Response.json({ post }, { status: 201 })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}