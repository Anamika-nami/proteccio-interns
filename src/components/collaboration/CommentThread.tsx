'use client'
import { useState, useEffect } from 'react'
import { CommentForm } from './CommentForm'
import { useApp } from '@/context/AppContext'
import type { CollaborationThread, CollaborationComment } from '@/types'

interface CommentThreadProps {
  thread: CollaborationThread
  onUpdate: () => void
}

export function CommentThread({ thread, onUpdate }: CommentThreadProps) {
  const { user } = useApp()
  const [comments, setComments] = useState<CollaborationComment[]>([])
  const [loading, setLoading] = useState(true)
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null)

  useEffect(() => {
    loadComments()
  }, [thread.id])

  const loadComments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/collaboration/comments?thread_id=${thread.id}`)
      const data = await response.json()
      setComments(data.comments || [])
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewComment = async (data: { content: string; mentions: string[]; attachments?: any[] }) => {
    try {
      const response = await fetch('/api/collaboration/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: thread.id,
          content: data.content,
          mentions: data.mentions,
          attachments: data.attachments || []
        })
      })

      if (response.ok) {
        loadComments()
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to create comment:', error)
    }
  }

  const handleReply = async (parentId: string, data: { content: string; mentions: string[]; attachments?: any[] }) => {
    try {
      const response = await fetch('/api/collaboration/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: thread.id,
          parent_comment_id: parentId,
          content: data.content,
          mentions: data.mentions,
          attachments: data.attachments || []
        })
      })

      if (response.ok) {
        setShowReplyForm(null)
        loadComments()
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to create reply:', error)
    }
  }

  const handleResolveThread = async () => {
    try {
      const response = await fetch(`/api/collaboration/threads/${thread.id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_note: 'Thread resolved' })
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to resolve thread:', error)
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

  const renderComment = (comment: CollaborationComment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-700 pl-4' : ''}`}>
      <div className="bg-gray-750 rounded-lg p-4 mb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">
              {comment.author?.email?.split('@')[0] || 'Unknown'}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-gray-500">(edited)</span>
            )}
          </div>
        </div>

        <div className="text-gray-300 mb-3 whitespace-pre-wrap">
          {comment.content}
        </div>

        {comment.attachments && comment.attachments.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-2">Attachments:</div>
            <div className="space-y-1">
              {comment.attachments.map((attachment: any, index: number) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {attachment.filename}
                </a>
              ))}
            </div>
          </div>
        )}

        {!isReply && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReplyForm(showReplyForm === comment.id ? null : comment.id)}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Reply
            </button>
          </div>
        )}

        {showReplyForm === comment.id && (
          <div className="mt-3">
            <CommentForm
              placeholder="Write a reply..."
              onSubmit={(data) => handleReply(comment.id, data)}
              onCancel={() => setShowReplyForm(null)}
            />
          </div>
        )}
      </div>

      {/* Render replies */}
      {comment.replies?.map(reply => renderComment(reply, true))}
    </div>
  )

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    )
  }

  const canResolve = user?.role === 'admin' || thread.created_by === user?.id

  return (
    <div className="p-4 space-y-4">
      {/* Thread Actions */}
      {thread.status === 'open' && canResolve && (
        <div className="flex justify-end">
          <button
            onClick={handleResolveThread}
            className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
          >
            Mark as Resolved
          </button>
        </div>
      )}

      {/* Comments */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            No comments yet
          </div>
        ) : (
          comments
            .filter(comment => !comment.parent_comment_id)
            .map(comment => {
              // Attach replies to parent comments
              const replies = comments.filter(c => c.parent_comment_id === comment.id)
              return renderComment({ ...comment, replies })
            })
        )}
      </div>

      {/* New Comment Form */}
      {thread.status === 'open' && (
        <div className="border-t border-gray-700 pt-4">
          <CommentForm
            placeholder="Add a comment..."
            onSubmit={handleNewComment}
          />
        </div>
      )}
    </div>
  )
}