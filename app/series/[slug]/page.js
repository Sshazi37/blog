export default function SeriesPage({ params }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Series: {params.slug}</h1>
      <p className="text-gray-500 mt-2">Coming soon.</p>
    </div>
  )
}