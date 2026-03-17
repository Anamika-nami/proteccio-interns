'use client'
import { useState } from 'react'
import type { DashboardInsight } from '@/types'

interface InsightCardProps {
  insight: DashboardInsight
  onDismiss: (insightId: string) => void
}

export function InsightCard({ insight, onDismiss }: InsightCardProps) {
  const [dismissing, setDismissing] = useState(false)

  const handleDismiss = async () => {
    setDismissing(true)
    try {
      await onDismiss(insight.id)
    } finally {
      setDismissing(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'overdue_tasks':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'learning_reminder':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      case 'collaboration_suggestion':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2m2-4h4a2 2 0 012 2v6a2 2 0 01-2 2h-4m0 0V8a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h4z" />
          </svg>
        )
      case 'achievement':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 3) return 'border-red-600 bg-red-900/20'
    if (priority >= 2) return 'border-yellow-600 bg-yellow-900/20'
    return 'border-blue-600 bg-blue-900/20'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 3) return 'High Priority'
    if (priority >= 2) return 'Medium Priority'
    return 'Low Priority'
  }

  return (
    <div className={`rounded-lg border p-4 ${getPriorityColor(insight.priority)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getInsightIcon(insight.insight_type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-white">{insight.title}</h3>
              <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                {getPriorityLabel(insight.priority)}
              </span>
            </div>
            
            {insight.description && (
              <p className="text-sm text-gray-300 leading-relaxed">
                {insight.description}
              </p>
            )}

            {/* Action Buttons based on insight type */}
            <div className="mt-3 flex items-center gap-2">
              {insight.insight_type === 'overdue_tasks' && (
                <button
                  onClick={() => window.location.href = '/intern/tasks'}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
                >
                  View Tasks
                </button>
              )}
              
              {insight.insight_type === 'learning_reminder' && (
                <button
                  onClick={() => window.location.href = '/learning'}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                >
                  Log Learning
                </button>
              )}
              
              {insight.insight_type === 'collaboration_suggestion' && (
                <button
                  onClick={() => window.location.href = '/intern/tasks'}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                >
                  Start Discussion
                </button>
              )}

              <button
                onClick={handleDismiss}
                disabled={dismissing}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                {dismissing ? 'Dismissing...' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          disabled={dismissing}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Additional data display */}
      {insight.data && Object.keys(insight.data).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex flex-wrap gap-4 text-xs text-gray-400">
            {insight.data.task_count && (
              <span>Tasks: {insight.data.task_count}</span>
            )}
            {insight.data.hours && (
              <span>Hours: {insight.data.hours}</span>
            )}
            {insight.data.days_since && (
              <span>Days ago: {insight.data.days_since}</span>
            )}
          </div>
        </div>
      )}

      {/* Expiration notice */}
      {insight.expires_at && (
        <div className="mt-2 text-xs text-gray-500">
          Expires: {new Date(insight.expires_at).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}