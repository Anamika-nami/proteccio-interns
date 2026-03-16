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
  created_at: string
}

function LeaveRequestContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [internId, setInternId] = useState<string | null>(null)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    document_url: ''
  })

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error || !data.user) {
        router.push('/admin/login')
        return
      }
      loadInternProfile(data.user.id)
    })

    return () => { mounted = false }
  }, [])

  async function loadInternProfile(userId: string) {
    const supabase = createClient()
    const { data: profile } = await supabase
      .from('intern_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (profile) {
      setInternId(profile.id)
      loadRequests(profile.id)
    } else {
      setLoading(false)
      toast.error('Intern profile not found')
    }
  }

  async function loadRequests(internId: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/leave/request?intern_id=${internId}`)
      const data = await res.json()
      setRequests(data.data || [])
    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!internId) return

    if (!formData.start_date || !formData.end_date || !formData.reason) {
      toast.error('Please fill in all required fields')
      return
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('End date must be after start date')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/leave/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intern_id: internId,
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason,
          document_url: formData.document_url || null
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message || 'Leave request submitted successfully')
        setShowForm(false)
        setFormData({
          start_date: '',
          end_date: '',
          reason: '',
          document_url: ''
        })
        loadRequests(internId)
      } else {
        toast.error(data.error || 'Submission failed')
      }
    } catch (error) {
      toast.error('Submission failed')
    } finally {
      setSubmitting(false)
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
      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 animate-pulse h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-200">Leave Requests</h2>
          <p className="text-xs text-gray-500">{requests.length} requests submitted</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Request Leave'}
        </button>
      </div>

      {/* Submit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-gray-300 text-sm mb-4">Submit Leave Request</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Start Date *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">End Date *</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {formData.start_date && formData.end_date && (
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-300">
                Duration: {calculateDays(formData.start_date, formData.end_date)} day(s)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-2">Reason *</label>
            <textarea
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide a detailed reason for your leave request..."
              rows={4}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Supporting Document URL (Optional)</label>
            <input
              type="url"
              value={formData.document_url}
              onChange={e => setFormData({ ...formData, document_url: e.target.value })}
              placeholder="https://example.com/document.pdf"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Upload your document to a cloud service and paste the link here</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      )}

      {/* Leave Requests List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-gray-300 text-sm">Previous Leave Requests</h3>
        </div>
        
        {requests.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-400 text-sm">No leave requests yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-blue-400 text-sm hover:text-blue-300"
            >
              Submit your first leave request →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {requests.map(request => (
              <div key={request.id} className="px-5 py-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-sm font-semibold text-gray-200">
                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                      </p>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">
                        {calculateDays(request.start_date, request.end_date)} day(s)
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{request.reason}</p>
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

                {request.admin_comment && (
                  <div className="mt-3 bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Admin Response:</p>
                    <p className="text-sm text-gray-300">{request.admin_comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default function LeaveRequestPage() {
  return (
    <AppProvider>
      <AppShell role="intern" title="Leave Requests" breadcrumbs={[{ label: 'Intern' }, { label: 'Leave Requests' }]}>
        <LeaveRequestContent />
      </AppShell>
    </AppProvider>
  )
}