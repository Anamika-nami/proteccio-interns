'use client'
import { useState } from 'react'
import { CommentThread } from './CommentThread'
import type { CollaborationThread } from '@/types'

interface ThreadListProps {
  threads: CollaborationThread[]
  onUpdate: () => void
}

export function ThreadList({ threads, onUpdate }: ThreadListProps) {
  const [expandedThread, setExpandedThread] = useState<string | null>(null)

  const handleThreadToggle = (threadId: string) => {
    setExpandedThread(expandedThread === threadId ? null : threadId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-400 bg-green-900 border-green-700'
      case 'resolved': return 'text-blue-400 bg-blue-900 border-blue-700'
      case 'archived': return 'text-gray-400 bg-gray-900 border-gray-700'
      default: return 'text-gray-400 bg-gray-900 border-gray-700'
    }
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400 text-sm">
        No discussions yet. Start the first one!
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {threads.map(thread => (
        <div key={thread.id} className="bg-gray-800 rounded-lg border border-gray-700">
          <button
            onClick={() => handleThreadToggle(thread.id)}
            className="w-full p-4 text-left hover:bg-gray-750 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-white">{thread.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(thread.status)}`}>
                    {thread.status}
                  </span>
                  {thread.has_unread && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  {thread.comment_count} comment{thread.comment_count !== 1 ? 's' : ''} • 
                  Started by {thread.created_by_profile?.email}
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedThread === thread.id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {expandedThread === thread.id && (
            <div className="border-t border-gray-700">
              <CommentThread thread={thread} onUpdate={onUpdate} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}