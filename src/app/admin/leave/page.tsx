'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import toast from 'react-hot-toast'

type LeaveRequest = {
  id: string
  start_date: string
  end_date: string
  reason: string
  status: string
  admin_comment: string | null
  document_url: string | null
  created_at: string
  intern_profiles: { full_name: string; cohort: string }
}

function LeaveRequestsContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [filterStatus, setFilterStatus] = useState('pending')
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
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
      loadRequests()
    })

    return () => { mounted = false }
  }, [filterStatus])

  async function loadRequests() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      
      const res = await fetch(`/api/leave/request?${params}`)
      const data = await res.json()
      setRequests(data.data || [])
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleReview(requestId: string, status: 'approved' | 'rejected') {
    setReviewing(true)
    try {
      const res = await fetch('/api/leave/review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leave_request_id: requestId,
          status: status,
          admin_comment: reviewComment || undefined
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message || 'Review submitted')
        setSelectedRequest(null)
        setReviewComment('')
        loadRequests()
      } else {
        toast.error(data.error || 'Review failed')
      }
    } catch (error) {
      toast.error('Review failed')
    } finally {
      setReviewing(false)
    }
  }

  function calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-900 text-yellow-300 border-yellow-700',
    approved: 'bg-green-900 text-green-300 border-green-700',
    rejected: 'bg-red-900 text-red-300 border-red-700',
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
          <h2 className="text-base font-semibold text-gray-200">Leave Request Review</h2>
          <p className="text-xs text-gray-500">{requests.length} requests to review</p>
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Leave Requests List */}
      {requests.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400">No leave requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(request => (
            <div key={request.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-sm font-semibold text-gray-200">{request.intern_profiles.full_name}</p>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">{request.intern_profiles.cohort}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">
                        {calculateDays(request.start_date, request.end_date)} day(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-blue-400">
                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{request.reason}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${statusColor[request.status]}`}>
                      {request.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {request.document_url && (
                  <div className="mb-3">
                    <a
                      href={request.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                    >
                      📎 View Supporting Document
                    </a>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="flex gap-2 pt-3 border-t border-gray-800">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Review
                    </button>
                  </div>
                )}

                {request.admin_comment && (
                  <div className="mt-3 bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Admin Response:</p>
                    <p className="text-sm text-gray-300">{request.admin_comment}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Review Leave Request</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Intern</p>
                <p className="text-sm text-gray-200">{selectedRequest.intern_profiles.full_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Duration</p>
                <p className="text-sm text-gray-200">
                  {new Date(selectedRequest.start_date).toLocaleDateString()} - {new Date(selectedRequest.end_date).toLocaleDateString()}
                  <span className="text-gray-400 ml-2">
                    ({calculateDays(selectedRequest.start_date, selectedRequest.end_date)} day(s))
                  </span>
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Reason</p>
                <p className="text-sm text-gray-200">{selectedRequest.reason}</p>
              </div>
              
              {selectedRequest.document_url && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Supporting Document</p>
                  <a
                    href={selectedRequest.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    📎 View Document
                  </a>
                </div>
              )}
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Admin Comments (Optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Add comments about your decision..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleReview(selectedRequest.id, 'approved')}
                disabled={reviewing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {reviewing ? 'Processing...' : 'Approve'}
              </button>
              <button
                onClick={() => handleReview(selectedRequest.id, 'rejected')}
                disabled={reviewing}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {reviewing ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setSelectedRequest(null)
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

export default function AdminLeaveRequestsPage() {
  return (
    <AppProvider>
      <AppShell role="admin" title="Leave Requests" breadcrumbs={[{ label: 'Admin' }, { label: 'Leave Requests' }]}>
        <LeaveRequestsContent />
      </AppShell>
    </AppProvider>
  )
}