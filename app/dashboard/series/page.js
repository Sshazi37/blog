import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import Series from '@/models/Series'
import Post from '@/models/Post'
import SeriesClient from '@/components/dashboard/SeriesClient'

export default async function SeriesPage() {
  const session = await getServerSession(authOptions)

  // Writers cannot manage series — admin and editor only
  if (session.user.role === 'writer' || session.user.role === 'subscriber') {
    redirect('/dashboard')
  }

  await connectDB()

  // Get series with actual post count using aggregation
  const series = await Series.aggregate([
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'series',
        as: 'posts',
      },
    },
    {
      $addFields: {
        // Count all posts in series regardless of status
        totalParts: { $size: '$posts' },
        // Count only published parts
        publishedParts: {
          $size: {
            $filter: {
              input: '$posts',
              cond: { $eq: ['$$this.status', 'published'] },
            },
          },
        },
      },
    },
    {
      $lookup: {
        // Also populate author info
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorData',
      },
    },
    {
      $addFields: {
        // $arrayElemAt gets first element from array
        // Because $lookup always returns an array
        author: { $arrayElemAt: ['$authorData', 0] },
      },
    },
    {
      $project: {
        title: 1,
        slug: 1,
        description: 1,
        coverImage: 1,
        status: 1,
        totalParts: 1,
        publishedParts: 1,
        createdAt: 1,
        'author.name': 1,
        'author._id': 1,
      },
    },
    { $sort: { createdAt: -1 } },
  ])

  return (
    <SeriesClient
      initialSeries={JSON.parse(JSON.stringify(series))}
    />
  )
}