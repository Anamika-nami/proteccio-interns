'use client'
import { useState, useEffect } from 'react'
import { ConversationList } from './ConversationList'
import { ConversationView } from './ConversationView'
import { NewConversationForm } from './NewConversationForm'
import { useApp } from '@/context/AppContext'
import type { MentorshipConversation } from '@/types'

export function MentorshipPanel() {
  const { user } = useApp()
  const [conversations, setConversations] = useState<MentorshipConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<MentorshipConversation | null>(null)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')

  useEffect(() => {
    loadConversations()
  }, [filter])

  const loadConversations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(filter !== 'all' && { status: filter }),
        limit: '50'
      })

      const response = await fetch(`/api/mentorship/conversations?${params}`)
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewConversation = async (data: {
    mentor_id: string
    subject: string
    category: string
    initial_message: string
    priority?: string
  }) => {
    try {
      const response = await fetch('/api/mentorship/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const result = await response.json()
        setShowNewConversation(false)
        setSelectedConversation(result.conversation)
        loadConversations()
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handleConversationUpdate = () => {
    loadConversations()
    if (selectedConversation) {
      // Refresh selected conversation
      const updated = conversations.find(c => c.id === selectedConversation.id)
      if (updated) {
        setSelectedConversation(updated)
      }
    }
  }

  const openConversations = conversations.filter(c => c.status === 'open').length
  const isIntern = user?.role === 'intern'

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mentorship</h1>
              <p className="text-gray-400">
                {isIntern 
                  ? 'Get guidance and support from experienced mentors'
                  : 'Provide guidance and support to interns'
                }
              </p>
            </div>
            
            {isIntern && (
              <button
                onClick={() => setShowNewConversation(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Ask for Help
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <div className="text-sm">
              <span className="text-gray-400">Open conversations:</span>
              <span className="text-white ml-2 font-medium">{openConversations}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-400">Total conversations:</span>
              <span className="text-white ml-2 font-medium">{conversations.length}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex gap-2">
            {(['all', 'open', 'resolved'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'open' && openConversations > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {openConversations}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onConversationSelect={setSelectedConversation}
              loading={loading}
            />
          </div>

          {/* Conversation View or New Conversation Form */}
          <div className="lg:col-span-2">
            {showNewConversation ? (
              <NewConversationForm
                onSubmit={handleNewConversation}
                onCancel={() => setShowNewConversation(false)}
              />
            ) : selectedConversation ? (
              <ConversationView
                conversation={selectedConversation}
                onUpdate={handleConversationUpdate}
              />
            ) : (
              <div className="bg-gray-900 rounded-lg border border-gray-700 p-8 text-center">
                <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-400">
                  Choose a conversation from the list to view messages and continue the discussion
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}