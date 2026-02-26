type Props = { count?: number; type?: 'card' | 'row' }

export default function SkeletonLoader({ count = 3, type = 'card' }: Props) {
  if (type === 'row') {
    return (
      <div className="space-y-3">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse h-16" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-gray-700 mb-4" />
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-700 rounded w-1/2 mb-4" />
          <div className="flex gap-2">
            <div className="h-5 bg-gray-700 rounded-full w-12" />
            <div className="h-5 bg-gray-700 rounded-full w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
