'use client'
import { useState, useEffect } from 'react'
import { MessageComposer } from './MessageComposer'
import { useApp } from '@/context/AppContext'
import type { MentorshipConversation, MentorshipMessage } from '@/types'

interface ConversationViewProps {
  conversation: MentorshipConversation
  onUpdate: () => void
}

export function ConversationView({ conversation, onUpdate }: ConversationViewProps) {
  const { user } = useApp()
  const [messages, setMessages] = useState<MentorshipMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMessages()
  }, [conversation.id])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/mentorship/messages?conversation_id=${conversation.id}`)
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (data: { content: string; attachments?: any[] }) => {
    try {
      const response = await fetch('/api/mentorship/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.id,
          content: data.content,
          attachments: data.attachments || []
        })
      })

      if (response.ok) {
        loadMessages()
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleResolveConversation = async () => {
    try {
      const response = await fetch(`/api/mentorship/conversations/${conversation.id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_note: 'Conversation resolved' })
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to resolve conversation:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        )
      case 'career':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
          </svg>
        )
      case 'task_help':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )
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

  const canResolve = user?.role === 'admin' || conversation.status === 'open'

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getCategoryIcon(conversation.category)}
            <div>
              <h1 className="text-xl font-semibold text-white">{conversation.subject}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(conversation.status)}`}>
                  {conversation.status}
                </span>
                <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(conversation.priority)}`}>
                  {conversation.priority}
                </span>
                <span className="text-sm text-gray-400 capitalize">
                  {conversation.category.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {conversation.status === 'open' && canResolve && (
            <button
              onClick={handleResolveConversation}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded transition-colors"
            >
              Mark as Resolved
            </button>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-400">
          <div className="flex items-center justify-between">
            <div>
              {conversation.intern && (
                <span>Intern: {conversation.intern.full_name} ({conversation.intern.cohort})</span>
              )}
              {conversation.mentor && (
                <span className="ml-4">Mentor: {conversation.mentor.email.split('@')[0]}</span>
              )}
            </div>
            <span>Started {formatDate(conversation.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No messages yet
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.sender_id === user?.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300'
                }`}
              >
                <div className="text-sm mb-1">
                  <span className="font-medium">
                    {message.sender?.email?.split('@')[0] || 'Unknown'}
                  </span>
                  <span className="text-xs opacity-75 ml-2">
                    {formatDate(message.created_at)}
                  </span>
                  {message.is_edited && (
                    <span className="text-xs opacity-75 ml-1">(edited)</span>
                  )}
                </div>
                
                <div className="whitespace-pre-wrap">
                  {message.content}
                </div>

                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.attachments.map((attachment: any, index: number) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm opacity-90 hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {attachment.filename}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Composer */}
      {conversation.status === 'open' && (
        <div className="border-t border-gray-700 p-6">
          <MessageComposer onSend={handleSendMessage} />
        </div>
      )}

      {conversation.status === 'resolved' && (
        <div className="border-t border-gray-700 p-6 text-center text-gray-400">
          <svg className="w-8 h-8 mx-auto mb-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>This conversation has been resolved</p>
          {conversation.resolved_at && (
            <p className="text-sm mt-1">
              Resolved on {formatDate(conversation.resolved_at)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}