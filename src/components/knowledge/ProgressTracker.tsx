'use client'
import { useState } from 'react'
import type { KnowledgeResource } from '@/types'

interface ProgressTrackerProps {
  resource: KnowledgeResource
  timeSpent: number
  onProgressUpdate: (progress: any) => void
}

export function ProgressTracker({ resource, timeSpent, onProgressUpdate }: ProgressTrackerProps) {
  const [progress, setProgress] = useState(resource.user_progress?.progress_percentage || 0)
  const [status, setStatus] = useState(resource.user_progress?.status || 'started')
  const [updating, setUpdating] = useState(false)

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress)
    if (newProgress === 100 && status !== 'completed') {
      setStatus('completed')
    } else if (newProgress < 100 && status === 'completed') {
      setStatus('started')
    }
  }

  const handleSaveProgress = async () => {
    setUpdating(true)
    try {
      await onProgressUpdate({
        status,
        progress_percentage: progress,
        time_spent_minutes: timeSpent
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkComplete = () => {
    setProgress(100)
    setStatus('completed')
  }

  const hasChanges = 
    progress !== (resource.user_progress?.progress_percentage || 0) ||
    status !== (resource.user_progress?.status || 'started')

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Your Progress</h2>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Progress</span>
          <span className="text-white">{progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Progress Slider */}
      <div className="space-y-2">
        <label className="text-sm text-gray-400">Update Progress</label>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={progress}
          onChange={(e) => handleProgressChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Status and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-400">Status:</span>
          <span className={`ml-2 px-2 py-1 rounded text-xs ${
            status === 'completed' 
              ? 'bg-green-900 text-green-300 border border-green-700'
              : 'bg-blue-900 text-blue-300 border border-blue-700'
          }`}>
            {status === 'completed' ? 'Completed' : 'In Progress'}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Time spent:</span>
          <span className="text-white ml-2">
            {timeSpent > 0 ? `${timeSpent} min` : 'Just started'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {status !== 'completed' && (
          <button
            onClick={handleMarkComplete}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
          >
            Mark as Complete
          </button>
        )}
        
        {hasChanges && (
          <button
            onClick={handleSaveProgress}
            disabled={updating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            {updating ? 'Saving...' : 'Save Progress'}
          </button>
        )}

        {status === 'completed' && (
          <div className="flex items-center gap-2 text-green-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">Completed!</span>
          </div>
        )}
      </div>

      {/* Completion Date */}
      {resource.user_progress?.completed_at && (
        <div className="text-sm text-gray-400">
          Completed on {new Date(resource.user_progress.completed_at).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}