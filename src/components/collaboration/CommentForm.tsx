'use client'
import { useState, useRef } from 'react'
import { MentionInput } from './MentionInput'
import { AttachmentUpload } from './AttachmentUpload'

interface CommentFormProps {
  placeholder: string
  onSubmit: (data: { title?: string; content: string; mentions: string[]; attachments?: any[] }) => Promise<void>
  onCancel?: () => void
  showTitle?: boolean
  initialContent?: string
}

export function CommentForm({ placeholder, onSubmit, onCancel, showTitle, initialContent = '' }: CommentFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(initialContent)
  const [mentions, setMentions] = useState<string[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || (showTitle && !title.trim())) return

    setSubmitting(true)
    try {
      await onSubmit({
        ...(showTitle && { title: title.trim() }),
        content: content.trim(),
        mentions,
        attachments
      })
      
      // Reset form
      setTitle('')
      setContent('')
      setMentions([])
      setAttachments([])
    } catch (error) {
      console.error('Failed to submit:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleMentionSelect = (userId: string, userName: string) => {
    if (!mentions.includes(userId)) {
      setMentions([...mentions, userId])
    }
    
    // Insert mention in content
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + `@${userName} ` + content.substring(end)
      setContent(newContent)
      
      // Set cursor position after mention
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + userName.length + 2
        textarea.focus()
      }, 0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-gray-800 p-4 rounded-lg border border-gray-700">
      {showTitle && (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Discussion title..."
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          required
        />
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
          required
        />
        
        <MentionInput
          onMentionSelect={handleMentionSelect}
          trigger="@"
          className="absolute top-2 right-2"
        />
      </div>

      <AttachmentUpload
        attachments={attachments}
        onAttachmentsChange={setAttachments}
        maxFiles={3}
        maxSizeMB={10}
      />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !content.trim() || (showTitle && !title.trim())}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  )
}