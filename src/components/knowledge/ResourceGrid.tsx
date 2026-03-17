'use client'
import { ResourceCard } from './ResourceCard'
import type { KnowledgeResource } from '@/types'

interface ResourceGridProps {
  resources: KnowledgeResource[]
  loading: boolean
  hasMore: boolean
  onResourceSelect: (resource: KnowledgeResource) => void
  onBookmark: (resourceId: string) => void
  onLoadMore: () => void
}

export function ResourceGrid({
  resources,
  loading,
  hasMore,
  onResourceSelect,
  onBookmark,
  onLoadMore
}: ResourceGridProps) {
  if (loading && resources.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-gray-900 rounded-lg border border-gray-700 p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-3"></div>
            <div className="h-3 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-700 rounded mb-4 w-3/4"></div>
            <div className="flex justify-between items-center">
              <div className="h-6 bg-gray-700 rounded w-16"></div>
              <div className="h-8 bg-gray-700 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 className="text-lg font-medium text-gray-300 mb-2">No resources found</h3>
        <p className="text-gray-400">
          Try adjusting your search criteria or browse different categories
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map(resource => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onSelect={() => onResourceSelect(resource)}
            onBookmark={() => onBookmark(resource.id)}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 text-white px-6 py-3 rounded-lg transition-colors"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </div>
            ) : (
              'Load More Resources'
            )}
          </button>
        </div>
      )}
    </div>
  )
}