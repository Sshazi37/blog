// Server component — fetches categories on the server
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import Category from '@/models/Category'
import Post from '@/models/Post'
import CategoriesClient from '@/components/dashboard/CategoriesClient'

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions)

  // Only admins can manage categories
  if (session.user.role !== 'admin') {
    redirect('/dashboard')
  }

  await connectDB()

  // Fetch categories with post count for each
  // We use aggregation here — more powerful than simple find()
  const categories = await Category.aggregate([
    {
      // $lookup is like SQL JOIN
      // It joins the posts collection into our categories results
      $lookup: {
        from: 'posts',         // collection to join
        localField: '_id',     // field in categories
        foreignField: 'category', // matching field in posts
        as: 'posts',           // name of the resulting array
      },
    },
    {
      // $addFields adds new computed fields to each document
      $addFields: {
        // Count only published posts
        postCount: {
          $size: {
            $filter: {
              input: '$posts',
              cond: { $eq: ['$$this.status', 'published'] },
              // $$this refers to each element in the array
            },
          },
        },
      },
    },
    {
      // $project controls which fields to include/exclude
      // 1 = include, 0 = exclude
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        color: 1,
        postCount: 1,
        createdAt: 1,
      },
    },
    { $sort: { name: 1 } },
  ])

  // Convert MongoDB objects to plain JSON for the client component
  return (
    <CategoriesClient
      initialCategories={JSON.parse(JSON.stringify(categories))}
    />
  )
}