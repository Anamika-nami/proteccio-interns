'use client'
import type { MentorshipConversation } from '@/types'

interface ConversationListProps {
  conversations: MentorshipConversation[]
  selectedConversation: MentorshipConversation | null
  onConversationSelect: (conversation: MentorshipConversation) => void
  loading: boolean
}

export function ConversationList({
  conversations,
  selectedConversation,
  onConversationSelect,
  loading
}: ConversationListProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return (
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        )
      case 'career':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
          </svg>
        )
      case 'task_help':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      case 'general':
        return (
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-900 border-red-700'
      case 'high': return 'text-orange-400 bg-orange-900 border-orange-700'
      case 'normal': return 'text-blue-400 bg-blue-900 border-blue-700'
      case 'low': return 'text-gray-400 bg-gray-900 border-gray-700'
      default: return 'text-gray-400 bg-gray-900 border-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-400 bg-green-900 border-green-700'
      case 'resolved': return 'text-blue-400 bg-blue-900 border-blue-700'
      case 'archived': return 'text-gray-400 bg-gray-900 border-gray-700'
      default: return 'text-gray-400 bg-gray-900 border-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-gray-900 rounded-lg border border-gray-700 p-4 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-700 rounded mb-2 w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-300 mb-2">No conversations</h3>
        <p className="text-gray-400 text-sm">
          Start a conversation to get help from mentors
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {conversations.map(conversation => (
        <button
          key={conversation.id}
          onClick={() => onConversationSelect(conversation)}
          className={`w-full text-left p-4 rounded-lg border transition-colors ${
            selectedConversation?.id === conversation.id
              ? 'bg-blue-900 border-blue-700'
              : 'bg-gray-900 border-gray-700 hover:bg-gray-800'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {getCategoryIcon(conversation.category)}
              <h3 className="font-medium text-white truncate">
                {conversation.subject}
              </h3>
            </div>
            {(conversation.unread_count || 0) > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {conversation.unread_count}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(conversation.status)}`}>
              {conversation.status}
            </span>
            <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(conversation.priority)}`}>
              {conversation.priority}
            </span>
            <span className="text-xs text-gray-400 capitalize">
              {conversation.category.replace('_', ' ')}
            </span>
          </div>

          <div className="text-sm text-gray-400">
            {conversation.intern ? (
              <span>From: {conversation.intern.full_name}</span>
            ) : conversation.mentor ? (
              <span>With: {conversation.mentor.email.split('@')[0]}</span>
            ) : null}
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>
              {conversation.message_count || 0} message{(conversation.message_count || 0) !== 1 ? 's' : ''}
            </span>
            <span>
              {formatDate(conversation.updated_at)}
            </span>
          </div>

          {conversation.latest_message && (
            <div className="mt-2 text-sm text-gray-400 truncate">
              {conversation.latest_message.content}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}