'use client'
import { useState } from 'react'

interface BookmarkButtonProps {
  isBookmarked: boolean
  onToggle: () => void
}

export function BookmarkButton({ isBookmarked, onToggle }: BookmarkButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)
    try {
      await onToggle()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="p-1 text-gray-400 hover:text-yellow-400 transition-colors disabled:opacity-50"
      title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
      ) : isBookmarked ? (
        <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 24 24">
          <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )}
    </button>
  )
}