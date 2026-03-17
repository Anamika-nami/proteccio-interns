'use client'
import { useState } from 'react'
import { TaskCollaborationPanel } from '../collaboration/TaskCollaborationPanel'
import { TaskGuidancePanel } from '../tasks/TaskGuidancePanel'
import type { Task } from '@/types'

interface TaskSummaryProps {
  tasks: Task[]
  showCollaboration?: boolean
  onTaskUpdate?: () => void
}

export function TaskSummary({ tasks, showCollaboration = false, onTaskUpdate }: TaskSummaryProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [expandedCollaboration, setExpandedCollaboration] = useState<string | null>(null)
  const [expandedGuidance, setExpandedGuidance] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'text-gray-400 bg-gray-900 border-gray-700'
      case 'in_progress': return 'text-yellow-400 bg-yellow-900 border-yellow-700'
      case 'done': return 'text-green-400 bg-green-900 border-green-700'
      default: return 'text-gray-400 bg-gray-900 border-gray-700'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400'
      case 'high': return 'text-orange-400'
      case 'normal': return 'text-blue-400'
      case 'low': return 'text-gray-400'
      default: return 'text-blue-400'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const handleTaskToggle = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId)
  }

  const handleCollaborationToggle = (taskId: string) => {
    setExpandedCollaboration(expandedCollaboration === taskId ? null : taskId)
  }

  const handleGuidanceToggle = (taskId: string) => {
    setExpandedGuidance(expandedGuidance === taskId ? null : taskId)
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-8 text-center">
        <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-lg font-medium text-gray-300 mb-2">No tasks</h3>
        <p className="text-gray-400">You're all caught up!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <div key={task.id} className="bg-gray-900 rounded-lg border border-gray-700">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-white">{task.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  {task.priority && (
                    <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  )}
                </div>

                {task.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  {task.due_date && (
                    <span className={isOverdue(task.due_date) ? 'text-red-400' : ''}>
                      Due: {formatDate(task.due_date)}
                      {isOverdue(task.due_date) && ' (Overdue)'}
                    </span>
                  )}
                  <span>Created: {formatDate(task.created_at)}</span>
                  {(task.collaboration_count || 0) > 0 && (
                    <span className="text-blue-400">
                      {task.collaboration_count} discussion{task.collaboration_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleTaskToggle(task.id)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className={`w-5 h-5 transition-transform ${expandedTask === task.id ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => window.location.href = `/tasks/${task.id}`}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
              >
                View Details
              </button>
              
              {showCollaboration && (
                <button
                  onClick={() => handleCollaborationToggle(task.id)}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                >
                  Collaborate
                </button>
              )}

              <button
                onClick={() => handleGuidanceToggle(task.id)}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors"
              >
                Get Help
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          {expandedTask === task.id && (
            <div className="border-t border-gray-700">
              {task.description && (
                <div className="p-4">
                  <h4 className="font-medium text-white mb-2">Description</h4>
                  <p className="text-gray-300 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Collaboration Panel */}
          {showCollaboration && (
            <TaskCollaborationPanel
              task={task}
              isExpanded={expandedCollaboration === task.id}
              onToggle={() => handleCollaborationToggle(task.id)}
            />
          )}

          {/* Guidance Panel */}
          <TaskGuidancePanel
            task={task}
            isExpanded={expandedGuidance === task.id}
            onToggle={() => handleGuidanceToggle(task.id)}
          />
        </div>
      ))}
    </div>
  )
}