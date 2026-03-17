'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ThreadList } from './ThreadList'
import { CommentForm } from './CommentForm'
import { useApp } from '@/context/AppContext'
import type { CollaborationThread, Task } from '@/types'

interface TaskCollaborationPanelProps {
  task: Task
  isExpanded: boolean
  onToggle: () => void
}

export function TaskCollaborationPanel({ task, isExpanded, onToggle }: TaskCollaborationPanelProps) {
  const { user } = useApp()
  const [threads, setThreads] = useState<CollaborationThread[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewThread, setShowNewThread] = useState(false)

  useEffect(() => {
    if (isExpanded) {
      loadThreads()
      subscribeToUpdates()
    }
  }, [isExpanded, task.id])

  const loadThreads = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/collaboration/threads?task_id=${task.id}`)
      const data = await response.json()
      setThreads(data.threads || [])
    } catch (error) {
      console.error('Failed to load threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToUpdates = () => {
    const supabase = createClient()
    const subscription = supabase
      .channel(`task-collaboration-${task.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'collaboration_threads',
        filter: `task_id=eq.${task.id}`
      }, loadThreads)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'collaboration_comments'
      }, loadThreads)
      .subscribe()

    return () => subscription.unsubscribe()
  }

  const handleNewThread = async (data: { title?: string; content: string; mentions: string[]; attachments?: any[] }) => {
    if (!data.title) return // Title is required for new threads
    
    try {
      const response = await fetch('/api/collaboration/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.id,
          title: data.title,
          initial_comment: data.content,
          mentions: data.mentions
        })
      })

      if (response.ok) {
        setShowNewThread(false)
        loadThreads()
      }
    } catch (error) {
      console.error('Failed to create thread:', error)
    }
  }

  const unreadCount = threads.filter(t => t.has_unread).length

  return (
    <div className="border-t border-gray-700 bg-gray-900">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-300">Collaboration</span>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {threads.length} discussion{threads.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setShowNewThread(true)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            >
              Start Discussion
            </button>
          </div>

          {showNewThread && (
            <CommentForm
              placeholder="Start a new discussion..."
              onSubmit={handleNewThread}
              onCancel={() => setShowNewThread(false)}
              showTitle={true}
            />
          )}

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <ThreadList threads={threads} onUpdate={loadThreads} />
          )}
        </div>
      )}
    </div>
  )
}