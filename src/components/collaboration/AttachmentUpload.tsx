'use client'
import { useState, useRef } from 'react'

interface Attachment {
  id: string
  filename: string
  url: string
  size: number
  type: string
}

interface AttachmentUploadProps {
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
  maxFiles?: number
  maxSizeMB?: number
}

export function AttachmentUpload({ 
  attachments, 
  onAttachmentsChange, 
  maxFiles = 3, 
  maxSizeMB = 10 
}: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList) => {
    if (attachments.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    setUploading(true)
    const newAttachments: Attachment[] = []

    for (const file of Array.from(files)) {
      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSizeMB}MB`)
        continue
      }

      // Validate file type (basic validation)
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]

      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not allowed`)
        continue
      }

      // For now, create a temporary URL (in production, upload to storage)
      const attachment: Attachment = {
        id: crypto.randomUUID(),
        filename: file.name,
        url: URL.createObjectURL(file), // Temporary URL
        size: file.size,
        type: file.type
      }

      newAttachments.push(attachment)
    }

    onAttachmentsChange([...attachments, ...newAttachments])
    setUploading(false)

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (attachmentId: string) => {
    const attachment = attachments.find(a => a.id === attachmentId)
    if (attachment && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url)
    }
    onAttachmentsChange(attachments.filter(a => a.id !== attachmentId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return (
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    } else if (type === 'application/pdf') {
      return (
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || attachments.length >= maxFiles}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-gray-300 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          {uploading ? 'Uploading...' : 'Attach Files'}
        </button>
        
        <span className="text-xs text-gray-400">
          {attachments.length}/{maxFiles} files • Max {maxSizeMB}MB each
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
        accept="image/*,.pdf,.txt,.doc,.docx"
      />

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map(attachment => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-2 bg-gray-800 rounded border border-gray-700"
            >
              {getFileIcon(attachment.type)}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{attachment.filename}</p>
                <p className="text-xs text-gray-400">{formatFileSize(attachment.size)}</p>
              </div>
              
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}