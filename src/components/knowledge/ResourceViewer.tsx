'use client'
import { useState, useEffect } from 'react'
import { ProgressTracker } from './ProgressTracker'
import type { KnowledgeResource } from '@/types'

interface ResourceViewerProps {
  resource: KnowledgeResource
  onClose: () => void
  onProgressUpdate: (resourceId: string, progress: any) => void
}

export function ResourceViewer({ resource, onClose, onProgressUpdate }: ResourceViewerProps) {
  const [startTime] = useState(Date.now())
  const [timeSpent, setTimeSpent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000 / 60)) // minutes
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [startTime])

  const handleProgressUpdate = (progress: any) => {
    onProgressUpdate(resource.id, {
      ...progress,
      time_spent_minutes: timeSpent
    })
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return (
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )
      case 'document':
        return (
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'link':
        return (
          <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
    <div className="bg-gray-900 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          {getContentTypeIcon(resource.content_type)}
          <div>
            <h1 className="text-2xl font-bold text-white">{resource.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-2 py-1 text-xs rounded border ${getDifficultyColor(resource.difficulty_level)}`}>
                {resource.difficulty_level}
              </span>
              <span className="text-sm text-gray-400 capitalize">
                {resource.content_type}
              </span>
              {resource.estimated_duration_minutes && (
                <span className="text-sm text-gray-400">
                  {formatDuration(resource.estimated_duration_minutes)}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Description */}
        {resource.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Description</h2>
            <p className="text-gray-300 leading-relaxed">{resource.description}</p>
          </div>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {resource.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content Access */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Access Resource</h2>
          
          {resource.external_url ? (
            <a
              href={resource.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open External Link
            </a>
          ) : resource.file_url ? (
            <a
              href={resource.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download File
            </a>
          ) : (
            <div className="text-gray-400 text-sm">
              No direct access link available
            </div>
          )}
        </div>

        {/* Progress Tracker */}
        <div className="border-t border-gray-700 pt-6">
          <ProgressTracker
            resource={resource}
            timeSpent={timeSpent}
            onProgressUpdate={handleProgressUpdate}
          />
        </div>

        {/* Metadata */}
        <div className="border-t border-gray-700 pt-6 mt-6">
          <h2 className="text-lg font-semibold text-white mb-4">Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Category:</span>
              <span className="text-white ml-2">{resource.category}</span>
            </div>
            <div>
              <span className="text-gray-400">Created:</span>
              <span className="text-white ml-2">
                {new Date(resource.created_at).toLocaleDateString()}
              </span>
            </div>
            {resource.created_by_profile && (
              <div>
                <span className="text-gray-400">Created by:</span>
                <span className="text-white ml-2">
                  {resource.created_by_profile.email.split('@')[0]}
                </span>
              </div>
            )}
            {resource.is_featured && (
              <div>
                <span className="text-yellow-400">⭐ Featured Resource</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}