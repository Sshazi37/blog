import connectDB from '@/lib/mongodb'
import Post from '@/models/Post'
import Category from '@/models/Category'

export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const categoryId = searchParams.get('category') || ''

    if (query.length < 2) {
      return Response.json({ posts: [], categories: [] })
    }

    // Build search query
    const searchQuery = {
      status: 'published',
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { excerpt: { $regex: query, $options: 'i' } },
      ],
    }

    // If a category is selected, filter by it
    if (categoryId) {
      searchQuery.category = categoryId
    }

    const [posts, categories] = await Promise.all([
      Post.find(searchQuery)
        .populate('category', 'name slug color')
        .select('title slug excerpt coverImage publishedAt category')
        .sort({ publishedAt: -1 })
        .limit(8)
        .lean(),
      Category.find({
        name: { $regex: query, $options: 'i' },
      })
        .limit(5)
        .lean(),
    ])

    return Response.json({ posts, categories })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}