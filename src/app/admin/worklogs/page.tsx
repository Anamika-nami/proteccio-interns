'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import toast from 'react-hot-toast'

type WorkLog = {
  id: string
  date: string
  description: string
  hours_spent: number
  challenges: string | null
  progress_status: string
  review_status: string
  admin_comments: string | null
  intern_profiles: { full_name: string; cohort: string }
  tasks: { title: string } | null
}

function WorkLogsContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [worklogs, setWorklogs] = useState<WorkLog[]>([])
  const [filterStatus, setFilterStatus] = useState('pending')
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error || !data.user) {
        router.push('/admin/login')
        return
      }
      loadWorklogs()
    })

    return () => { mounted = false }
  }, [filterStatus])

  async function loadWorklogs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.append('review_status', filterStatus)
      
      const res = await fetch(`/api/worklogs?${params}`)
      const data = await res.json()
      setWorklogs(data.data || [])
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(workLogId: string, status: 'approved' | 'revision_requested') {
    setReviewing(true)
    try {
      const res = await fetch('/api/worklogs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          work_log_id: workLogId,
          review_status: status,
          admin_comments: reviewComment || undefined
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message || 'Review submitted')
        setSelectedLog(null)
        setReviewComment('')
        loadWorklogs()
      } else {
        toast.error(data.error || 'Review failed')
      }
    } catch (error) {
      toast.error('Review failed')
    } finally {
      setReviewing(false)
    }
  }

  const reviewStatusColor: Record<string, string> = {
    pending: 'bg-yellow-900 text-yellow-300 border-yellow-700',
    approved: 'bg-green-900 text-green-300 border-green-700',
    revision_requested: 'bg-red-900 text-red-300 border-red-700',
  }

  const progressStatusColor: Record<string, string> = {
    not_started: 'bg-gray-800 text-gray-400 border-gray-600',
    in_progress: 'bg-blue-900 text-blue-300 border-blue-700',
    completed: 'bg-green-900 text-green-300 border-green-700',
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-200">Work Log Review</h2>
          <p className="text-xs text-gray-500">{worklogs.length} logs to review</p>
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="revision_requested">Revision Requested</option>
        </select>
      </div>

      {/* Work Logs List */}
      {worklogs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400">No work logs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {worklogs.map(log => (
            <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-sm font-semibold text-gray-200">{log.intern_profiles.full_name}</p>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">{log.intern_profiles.cohort}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">
                        {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {log.tasks && (
                      <p className="text-xs text-blue-400 mb-2">Task: {log.tasks.title}</p>
                    )}
                    <p className="text-sm text-gray-300">{log.description}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${reviewStatusColor[log.review_status]}`}>
                      {log.review_status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">{log.hours_spent}h</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs px-2 py-1 rounded-full border ${progressStatusColor[log.progress_status]}`}>
                    {log.progress_status.replace('_', ' ')}
                  </span>
                  {log.challenges && (
                    <span className="text-xs text-yellow-400">⚠ Challenges: {log.challenges}</span>
                  )}
                </div>

                {log.review_status === 'pending' && (
                  <div className="flex gap-2 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Review
                    </button>
                  </div>
                )}

                {log.admin_comments && (
                  <div className="mt-3 bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Admin Feedback:</p>
                    <p className="text-sm text-gray-300">{log.admin_comments}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Review Work Log</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Intern</p>
                <p className="text-sm text-gray-200">{selectedLog.intern_profiles.full_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Date</p>
                <p className="text-sm text-gray-200">{new Date(selectedLog.date).toLocaleDateString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-200">{selectedLog.description}</p>
              </div>
              
              {selectedLog.challenges && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Challenges</p>
                  <p className="text-sm text-yellow-400">{selectedLog.challenges}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Admin Comments (Optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Add feedback or comments..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleReview(selectedLog.id, 'approved')}
                disabled={reviewing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {reviewing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleReview(selectedLog.id, 'revision_requested')}
                disabled={reviewing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {reviewing ? 'Processing...' : 'Request Revision'}
              </button>
              <button
                onClick={() => {
                  setSelectedLog(null)
                  setReviewComment('')
                }}
                disabled={reviewing}
                className="px-4 py-2 border border-gray-700 hover:border-gray-500 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default function AdminWorkLogsPage() {
  return (
    <AppProvider>
      <AppShell role="admin" title="Work Logs" breadcrumbs={[{ label: 'Admin' }, { label: 'Work Logs' }]}>
        <WorkLogsContent />
      </AppShell>
    </AppProvider>
  )
}
