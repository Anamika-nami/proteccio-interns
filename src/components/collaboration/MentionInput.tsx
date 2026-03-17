'use client'
import { useState, useEffect, useRef } from 'react'

interface User {
  id: string
  email: string
  full_name?: string
}

interface MentionInputProps {
  onMentionSelect: (userId: string, userName: string) => void
  trigger: string
  className?: string
}

export function MentionInput({ onMentionSelect, trigger, className = '' }: MentionInputProps) {
  const [users, setUsers] = useState<User[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users?role=admin,intern&limit=20')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMentionClick = () => {
    if (!showSuggestions) {
      loadUsers()
    }
    setShowSuggestions(!showSuggestions)
  }

  const handleUserSelect = (user: User) => {
    const displayName = user.full_name || user.email.split('@')[0]
    onMentionSelect(user.id, displayName)
    setShowSuggestions(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleMentionClick}
        className="p-1 text-gray-400 hover:text-white transition-colors"
        title="Mention someone"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>

      {showSuggestions && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-3 text-center text-gray-400 text-sm">
              No users found
            </div>
          ) : (
            <div className="py-1">
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors"
                >
                  <div className="text-sm text-white">
                    {user.full_name || user.email.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-400">
                    {user.email}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}