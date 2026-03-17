'use client'
import { useState, useEffect } from 'react'

interface Mentor {
  id: string
  email: string
  full_name?: string
}

interface MentorSelectorProps {
  selectedMentorId: string
  onMentorSelect: (mentorId: string) => void
}

export function MentorSelector({ selectedMentorId, onMentorSelect }: MentorSelectorProps) {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMentors()
  }, [])

  const loadMentors = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users?role=admin&limit=50')
      const data = await response.json()
      setMentors(data.users || [])
    } catch (error) {
      console.error('Failed to load mentors:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (mentors.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center text-gray-400">
        No mentors available
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {mentors.map(mentor => (
        <label
          key={mentor.id}
          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
            selectedMentorId === mentor.id
              ? 'bg-blue-900 border-blue-700 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
          }`}
        >
          <input
            type="radio"
            name="mentor"
            value={mentor.id}
            checked={selectedMentorId === mentor.id}
            onChange={(e) => onMentorSelect(e.target.value)}
            className="sr-only"
          />
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            
            <div>
              <div className="font-medium">
                {mentor.full_name || mentor.email.split('@')[0]}
              </div>
              <div className="text-sm text-gray-400">
                {mentor.email}
              </div>
            </div>
          </div>

          {selectedMentorId === mentor.id && (
            <div className="ml-auto">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </label>
      ))}
    </div>
  )
}