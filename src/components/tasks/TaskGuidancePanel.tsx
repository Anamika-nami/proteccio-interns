'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import type { Task } from '@/types'

interface TaskSuggestion {
  type: 'step' | 'resource' | 'documentation' | 'similar_task'
  title: string
  description: string
  url?: string
  resource_id?: string
  confidence: number
}

interface TaskGuidancePanelProps {
  task: Task
  isExpanded: boolean
  onToggle: () => void
}

export function TaskGuidancePanel({ task, isExpanded, onToggle }: TaskGuidancePanelProps) {
  const { user } = useApp()
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isExpanded && suggestions.length === 0) {
      loadSuggestions()
    }
  }, [isExpanded, task.id])

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/suggestions`)
      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'step':
        return (
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )
      case 'resource':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      case 'documentation':
        return (
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'similar_task':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      default:
        return null
    }
  }

  const handleSuggestionClick = (suggestion: TaskSuggestion) => {
    if (suggestion.url) {
      window.open(suggestion.url, '_blank')
    } else if (suggestion.resource_id) {
      // Navigate to knowledge hub resource
      window.open(`/knowledge/${suggestion.resource_id}`, '_blank')
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-600'
    if (confidence >= 0.6) return 'bg-yellow-600'
    return 'bg-gray-600'
  }

  return (
    <div className="border-t border-gray-700 bg-gray-900">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-sm font-medium text-gray-300">Task Guidance</span>
          {suggestions.length > 0 && (
            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
              {suggestions.length}
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
        <div className="px-4 pb-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-xs text-gray-400 mt-2">Generating suggestions...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">No suggestions available for this task</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-gray-400 mb-3">
                AI-powered suggestions to help you complete this task
              </div>
              
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-3 bg-gray-800 rounded-lg border border-gray-700 ${
                    suggestion.url || suggestion.resource_id 
                      ? 'cursor-pointer hover:bg-gray-750 transition-colors' 
                      : ''
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-white truncate">
                          {suggestion.title}
                        </h4>
                        <div 
                          className={`w-2 h-2 rounded-full ${getConfidenceColor(suggestion.confidence)}`}
                          title={`Confidence: ${Math.round(suggestion.confidence * 100)}%`}
                        />
                      </div>
                      
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {suggestion.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded capitalize">
                          {suggestion.type.replace('_', ' ')}
                        </span>
                        
                        {(suggestion.url || suggestion.resource_id) && (
                          <span className="text-xs text-blue-400">
                            Click to open →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}