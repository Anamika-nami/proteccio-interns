'use client'
import { useState, useEffect } from 'react'
import { MentorSelector } from './MentorSelector'

interface NewConversationFormProps {
  onSubmit: (data: {
    mentor_id: string
    subject: string
    category: string
    initial_message: string
    priority?: string
  }) => Promise<void>
  onCancel: () => void
}

export function NewConversationForm({ onSubmit, onCancel }: NewConversationFormProps) {
  const [mentorId, setMentorId] = useState('')
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('technical')
  const [priority, setPriority] = useState('normal')
  const [initialMessage, setInitialMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mentorId || !subject.trim() || !initialMessage.trim()) return

    setSubmitting(true)
    try {
      await onSubmit({
        mentor_id: mentorId,
        subject: subject.trim(),
        category,
        initial_message: initialMessage.trim(),
        priority
      })
    } catch (error) {
      console.error('Failed to create conversation:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const categories = [
    { value: 'technical', label: 'Technical Help', description: 'Code, debugging, technical concepts' },
    { value: 'career', label: 'Career Guidance', description: 'Career advice, professional development' },
    { value: 'task_help', label: 'Task Assistance', description: 'Help with specific assignments' },
    { value: 'general', label: 'General Discussion', description: 'General questions and conversations' }
  ]

  const priorities = [
    { value: 'low', label: 'Low', description: 'Non-urgent, can wait' },
    { value: 'normal', label: 'Normal', description: 'Standard priority' },
    { value: 'high', label: 'High', description: 'Important, needs attention soon' },
    { value: 'urgent', label: 'Urgent', description: 'Critical, needs immediate attention' }
  ]

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Start New Conversation</h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mentor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Mentor
          </label>
          <MentorSelector
            selectedMentorId={mentorId}
            onMentorSelect={setMentorId}
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of what you need help with..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Category
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map(cat => (
              <label
                key={cat.value}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  category === cat.value
                    ? 'bg-blue-900 border-blue-700 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={category === cat.value}
                  onChange={(e) => setCategory(e.target.value)}
                  className="sr-only"
                />
                <div className="font-medium">{cat.label}</div>
                <div className="text-sm text-gray-400">{cat.description}</div>
              </label>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          >
            {priorities.map(p => (
              <option key={p.value} value={p.value}>
                {p.label} - {p.description}
              </option>
            ))}
          </select>
        </div>

        {/* Initial Message */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Message
          </label>
          <textarea
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            placeholder="Describe your question or what you need help with in detail..."
            rows={5}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
            required
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !mentorId || !subject.trim() || !initialMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Starting Conversation...
              </div>
            ) : (
              'Start Conversation'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}