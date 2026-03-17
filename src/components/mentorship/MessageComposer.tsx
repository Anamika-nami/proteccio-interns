'use client'
import { useState } from 'react'
import { AttachmentUpload } from '../collaboration/AttachmentUpload'

interface MessageComposerProps {
  onSend: (data: { content: string; attachments?: any[] }) => Promise<void>
}

export function MessageComposer({ onSend }: MessageComposerProps) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<any[]>([])
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setSending(true)
    try {
      await onSend({
        content: content.trim(),
        attachments
      })
      
      // Reset form
      setContent('')
      setAttachments([])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
          required
        />
      </div>

      <AttachmentUpload
        attachments={attachments}
        onAttachmentsChange={setAttachments}
        maxFiles={3}
        maxSizeMB={10}
      />

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </div>
        
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          {sending ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sending...
            </div>
          ) : (
            'Send Message'
          )}
        </button>
      </div>
    </form>
  )
}