type Props = { count?: number; type?: 'card' | 'row' }

export default function SkeletonLoader({ count = 3, type = 'card' }: Props) {
  if (type === 'row') return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 animate-pulse flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-gray-700 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-700 rounded w-1/3" />
            <div className="h-3 bg-gray-800 rounded w-1/5" />
          </div>
          <div className="h-6 w-16 bg-gray-700 rounded-full" />
        </div>
      ))}
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-gray-700 rounded w-2/3" />
              <div className="h-3 bg-gray-800 rounded w-1/3" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-800 rounded" />
            <div className="h-3 bg-gray-800 rounded w-4/5" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-gray-700 rounded-full" />
            <div className="h-6 w-16 bg-gray-700 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
