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
  tasks: { id: string; title: string } | null
}

type Task = {
  id: string
  title: string
  status: string
}

function WorkLogsContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [internId, setInternId] = useState<string | null>(null)
  const [worklogs, setWorklogs] = useState<WorkLog[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    task_id: '',
    description: '',
    hours_spent: '',
    challenges: '',
    progress_status: 'in_progress'
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
      loadData(profile.id)
    } else {
      setLoading(false)
      toast.error('Intern profile not found')
    }
  }

  async function loadData(internId: string) {
    setLoading(true)
    try {
      // Load work logs
      const logsRes = await fetch(`/api/worklogs?intern_id=${internId}`)
      const logsData = await logsRes.json()
      setWorklogs(logsData.data || [])

      // Load tasks
      const tasksRes = await fetch(`/api/tasks?assigned_to=${internId}`)
      const tasksData = await tasksRes.json()
      setTasks(Array.isArray(tasksData) ? tasksData : [])

    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!internId) return

    if (!formData.description || !formData.hours_spent) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/worklogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intern_id: internId,
          task_id: formData.task_id || null,
          description: formData.description,
          hours_spent: parseFloat(formData.hours_spent),
          challenges: formData.challenges || null,
          progress_status: formData.progress_status
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message || 'Work log submitted successfully')
        setShowForm(false)
        setFormData({
          task_id: '',
          description: '',
          hours_spent: '',
          challenges: '',
          progress_status: 'in_progress'
        })
        loadData(internId)
      } else {
        toast.error(data.error || 'Submission failed')
      }
    } catch (error) {
      toast.error('Submission failed')
    } finally {
      setSubmitting(false)
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
          <h2 className="text-base font-semibold text-gray-200">Work Logs</h2>
          <p className="text-xs text-gray-500">{worklogs.length} logs submitted</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Submit Work Log'}
        </button>
      </div>

      {/* Submit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-gray-300 text-sm mb-4">Submit Daily Work Log</h3>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">Task (Optional)</label>
            <select
              value={formData.task_id}
              onChange={e => setFormData({ ...formData, task_id: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a task</option>
              {tasks.map(task => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Work Description *</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what you worked on today..."
              rows={4}
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Hours Spent *</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={formData.hours_spent}
                onChange={e => setFormData({ ...formData, hours_spent: e.target.value })}
                placeholder="e.g., 4.5"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Progress Status *</label>
              <select
                value={formData.progress_status}
                onChange={e => setFormData({ ...formData, progress_status: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Challenges Faced (Optional)</label>
            <textarea
              value={formData.challenges}
              onChange={e => setFormData({ ...formData, challenges: e.target.value })}
              placeholder="Any blockers or challenges you encountered..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Work Log'}
          </button>
        </form>
      )}

      {/* Work Logs List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-gray-300 text-sm">Previous Work Logs</h3>
        </div>
        
        {worklogs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-400 text-sm">No work logs yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-blue-400 text-sm hover:text-blue-300"
            >
              Submit your first work log →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {worklogs.map(log => (
              <div key={log.id} className="px-5 py-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-gray-200 font-medium">
                        {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {log.tasks && (
                        <span className="text-xs text-blue-400">• {log.tasks.title}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{log.description}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${reviewStatusColor[log.review_status]}`}>
                      {log.review_status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">{log.hours_spent}h</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <span className={`text-xs px-2 py-1 rounded-full border ${progressStatusColor[log.progress_status]}`}>
                    {log.progress_status.replace('_', ' ')}
                  </span>
                  
                  {log.challenges && (
                    <span className="text-xs text-yellow-400">⚠ Challenges noted</span>
                  )}
                </div>

                {log.admin_comments && (
                  <div className="mt-3 bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Admin Feedback:</p>
                    <p className="text-sm text-gray-300">{log.admin_comments}</p>
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

export default function WorkLogsPage() {
  return (
    <AppProvider>
      <AppShell role="intern" title="Work Logs" breadcrumbs={[{ label: 'Intern' }, { label: 'Work Logs' }]}>
        <WorkLogsContent />
      </AppShell>
    </AppProvider>
  )
}
