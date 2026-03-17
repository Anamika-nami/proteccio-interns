'use client'
import { useState } from 'react'
import type { LearningLog } from '@/types'

interface VerificationQueueProps {
  logs: LearningLog[]
  loading: boolean
  onVerify: (logId: string, status: 'verified' | 'rejected', notes?: string) => void
}

export function VerificationQueue({ logs, loading, onVerify }: VerificationQueueProps) {
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [verificationNotes, setVerificationNotes] = useState<Record<string, string>>({})

  const handleVerify = (logId: string, status: 'verified' | 'rejected') => {
    const notes = verificationNotes[logId]?.trim()
    onVerify(logId, status, notes || undefined)
    
    // Clear notes after verification
    setVerificationNotes(prev => {
      const updated = { ...prev }
      delete updated[logId]
      return updated
    })
    
    // Collapse if expanded
    if (expandedLog === logId) {
      setExpandedLog(null)
    }
  }

  const updateNotes = (logId: string, notes: string) => {
    setVerificationNotes(prev => ({
      ...prev,
      [logId]: notes
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-400 bg-green-900 border-green-700'
      case 'rejected': return 'text-red-400 bg-red-900 border-red-700'
      case 'pending': return 'text-yellow-400 bg-yellow-900 border-yellow-700'
      default: return 'text-gray-400 bg-gray-900 border-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-gray-900 rounded-lg border border-gray-700 p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded mb-3"></div>
            <div className="h-3 bg-gray-700 rounded mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  const pendingLogs = logs.filter(log => log.verification_status === 'pending')
  const otherLogs = logs.filter(log => log.verification_status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Pending Verification */}
      {pendingLogs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Pending Verification ({pendingLogs.length})
          </h2>
          <div className="space-y-4">
            {pendingLogs.map(log => (
              <div key={log.id} className="bg-gray-900 rounded-lg border border-gray-700">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-white">{log.topic}</h3>
                        <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(log.verification_status)}`}>
                          {log.verification_status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <span>By: {log.intern?.full_name}</span>
                        <span>Category: {log.category}</span>
                        <span>Time: {log.time_spent_hours}h</span>
                        <span>Submitted: {formatDate(log.created_at)}</span>
                      </div>

                      {log.description && (
                        <p className="text-gray-300 mb-3">{log.description}</p>
                      )}

                      {log.tools_used && log.tools_used.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-sm text-gray-400">Tools:</span>
                          {log.tools_used.map(tool => (
                            <span key={tool} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}

                      {log.evidence_url && (
                        <div className="mb-3">
                          <a
                            href={log.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Evidence
                          </a>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg
                        className={`w-5 h-5 transition-transform ${expandedLog === log.id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleVerify(log.id, 'verified')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => handleVerify(log.id, 'rejected')}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {expandedLog === log.id ? 'Less' : 'Add Notes'}
                    </button>
                  </div>
                </div>

                {/* Expanded Section */}
                {expandedLog === log.id && (
                  <div className="border-t border-gray-700 p-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Verification Notes (optional)
                        </label>
                        <textarea
                          value={verificationNotes[log.id] || ''}
                          onChange={(e) => updateNotes(log.id, e.target.value)}
                          placeholder="Add notes about the verification decision..."
                          rows={3}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleVerify(log.id, 'verified')}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
                        >
                          Verify with Notes
                        </button>
                        <button
                          onClick={() => handleVerify(log.id, 'rejected')}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition-colors"
                        >
                          Reject with Notes
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Processed */}
      {otherLogs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Recently Processed
          </h2>
          <div className="space-y-4">
            {otherLogs.slice(0, 10).map(log => (
              <div key={log.id} className="bg-gray-900 rounded-lg border border-gray-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-white">{log.topic}</h3>
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(log.verification_status)}`}>
                        {log.verification_status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                      <span>By: {log.intern?.full_name}</span>
                      <span>Time: {log.time_spent_hours}h</span>
                      <span>Verified: {log.verified_at ? formatDate(log.verified_at) : 'N/A'}</span>
                    </div>

                    {log.verification_notes && (
                      <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
                        <p className="text-sm text-gray-300">
                          <span className="font-medium">Admin notes:</span> {log.verification_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {logs.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No learning logs</h3>
          <p className="text-gray-400">
            Learning logs will appear here when interns submit them for verification
          </p>
        </div>
      )}
    </div>
  )
}