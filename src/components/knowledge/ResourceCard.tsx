'use client'
import { BookmarkButton } from './BookmarkButton'
import type { KnowledgeResource } from '@/types'

interface ResourceCardProps {
  resource: KnowledgeResource
  onSelect: () => void
  onBookmark: () => void
}

export function ResourceCard({ resource, onSelect, onBookmark }: ResourceCardProps) {
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )
      case 'document':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'link':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )
      case 'tutorial':
        return (
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      case 'reference':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-400 bg-green-900 border-green-700'
      case 'intermediate': return 'text-yellow-400 bg-yellow-900 border-yellow-700'
      case 'advanced': return 'text-red-400 bg-red-900 border-red-700'
      default: return 'text-gray-400 bg-gray-900 border-gray-700'
    }
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return null
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getContentTypeIcon(resource.content_type)}
            <span className="text-xs text-gray-400 capitalize">
              {resource.content_type}
            </span>
          </div>
          <BookmarkButton
            isBookmarked={resource.is_bookmarked || false}
            onToggle={onBookmark}
          />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors cursor-pointer line-clamp-2">
          {resource.title}
        </h3>

        {/* Description */}
        {resource.description && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-3">
            {resource.description}
          </p>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {resource.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded">
                +{resource.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded border ${getDifficultyColor(resource.difficulty_level)}`}>
              {resource.difficulty_level}
            </span>
            {resource.estimated_duration_minutes && (
              <span className="text-xs text-gray-400">
                {formatDuration(resource.estimated_duration_minutes)}
              </span>
            )}
          </div>

          <button
            onClick={onSelect}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors"
          >
            View
          </button>
        </div>

        {/* Progress Bar */}
        {resource.user_progress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{resource.user_progress.progress_percentage}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${resource.user_progress.progress_percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Featured Badge */}
        {resource.is_featured && (
          <div className="absolute top-2 right-2">
            <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
              Featured
            </span>
          </div>
        )}
      </div>
    </div>
  )
}