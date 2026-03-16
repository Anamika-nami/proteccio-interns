'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import toast from 'react-hot-toast'

type WeeklySummary = {
  id: string
  intern_id: string
  week_start_date: string
  week_end_date: string
  tasks_completed: number
  tasks_pending: number
  attendance_percentage: number
  work_logs_submitted: number
  work_logs_expected: number
  total_hours_logged: number
  admin_remarks: string | null
  generated_at: string
  intern_profiles: { full_name: string; cohort: string }
}

type Intern = {
  id: string
  full_name: string
  cohort: string
}

function WeeklySummaryContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState<WeeklySummary[]>([])
  const [interns, setInterns] = useState<Intern[]>([])
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    intern_id: '',
    week_start_date: '',
    week_end_date: '',
    admin_remarks: ''
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
      loadData()
    })

    return () => { mounted = false }
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Load summaries
      const summariesRes = await fetch('/api/weekly-summary')
      const summariesData = await summariesRes.json()
      setSummaries(summariesData.data || [])

      // Load interns
      const internsRes = await fetch('/api/interns')
      const internsData = await internsRes.json()
      setInterns(Array.isArray(internsData) ? internsData : [])

    } catch (error) {
      console.error('Load error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.week_start_date || !formData.week_end_date) {
      toast.error('Please select week start and end dates')
      return
    }

    if (new Date(formData.week_end_date) < new Date(formData.week_start_date)) {
      toast.error('End date must be after start date')
      return
    }

    setGenerating(true)
    try {
      const res = await fetch('/api/weekly-summary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intern_id: formData.intern_id || undefined,
          week_start_date: formData.week_start_date,
          week_end_date: formData.week_end_date,
          admin_remarks: formData.admin_remarks || undefined
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        toast.success(data.message || 'Weekly summaries generated successfully')
        setShowForm(false)
        setFormData({
          intern_id: '',
          week_start_date: '',
          week_end_date: '',
          admin_remarks: ''
        })
        loadData()
      } else {
        toast.error(data.error || 'Generation failed')
      }
    } catch (error) {
      toast.error('Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  function getWeekDates(offset: number = 0) {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Adjust for Sunday
    const monday = new Date(today.setDate(diff + (offset * 7)))
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)
    
    return {
      start: monday.toISOString().split('T')[0],
      end: friday.toISOString().split('T')[0]
    }
  }

  function setCurrentWeek() {
    const dates = getWeekDates(0)
    setFormData({
      ...formData,
      week_start_date: dates.start,
      week_end_date: dates.end
    })
  }

  function setPreviousWeek() {
    const dates = getWeekDates(-1)
    setFormData({
      ...formData,
      week_start_date: dates.start,
      week_end_date: dates.end
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-200">Weekly Performance Summaries</h2>
          <p className="text-xs text-gray-500">{summaries.length} summaries generated</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Generate Summary'}
        </button>
      </div>

      {/* Generate Form */}
      {showForm && (
        <form onSubmit={handleGenerate} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-gray-300 text-sm mb-4">Generate Weekly Summary</h3>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">Intern (Optional)</label>
            <select
              value={formData.intern_id}
              onChange={e => setFormData({ ...formData, intern_id: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Active Interns</option>
              {interns.map(intern => (
                <option key={intern.id} value={intern.id}>{intern.full_name} ({intern.cohort})</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Leave empty to generate for all active interns</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Week Start Date *</label>
              <input
                type="date"
                value={formData.week_start_date}
                onChange={e => setFormData({ ...formData, week_start_date: e.target.value })}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Week End Date *</label>
              <input
                type="date"
                value={formData.week_end_date}
                onChange={e => setFormData({ ...formData, week_end_date: e.target.value })}
                min={formData.week_start_date}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={setCurrentWeek}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
            >
              Current Week
            </button>
            <button
              type="button"
              onClick={setPreviousWeek}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
            >
              Previous Week
            </button>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Admin Remarks (Optional)</label>
            <textarea
              value={formData.admin_remarks}
              onChange={e => setFormData({ ...formData, admin_remarks: e.target.value })}
              placeholder="Add any general remarks for this week..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {generating ? 'Generating...' : 'Generate Weekly Summary'}
          </button>
        </form>
      )}

      {/* Summaries List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-gray-300 text-sm">Generated Summaries</h3>
        </div>
        
        {summaries.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-400 text-sm">No summaries generated yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-blue-400 text-sm hover:text-blue-300"
            >
              Generate your first summary →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {summaries.map(summary => (
              <div key={summary.id} className="px-5 py-4 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-sm font-semibold text-gray-200">{summary.intern_profiles.full_name}</p>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">{summary.intern_profiles.cohort}</span>
                    </div>
                    <p className="text-xs text-blue-400 mb-2">
                      Week: {new Date(summary.week_start_date).toLocaleDateString()} - {new Date(summary.week_end_date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      Generated: {new Date(summary.generated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Tasks</p>
                    <p className="text-sm text-green-400 font-semibold">
                      {summary.tasks_completed} / {summary.tasks_completed + summary.tasks_pending}
                    </p>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Attendance</p>
                    <p className={`text-sm font-semibold ${
                      summary.attendance_percentage >= 90 ? 'text-green-400' :
                      summary.attendance_percentage >= 75 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {summary.attendance_percentage.toFixed(1)}%
                    </p>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Work Logs</p>
                    <p className="text-sm text-blue-400 font-semibold">
                      {summary.work_logs_submitted} / {summary.work_logs_expected}
                    </p>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Hours</p>
                    <p className="text-sm text-purple-400 font-semibold">
                      {summary.total_hours_logged.toFixed(1)}h
                    </p>
                  </div>
                </div>

                {summary.admin_remarks && (
                  <div className="mt-3 bg-gray-800/50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Admin Remarks:</p>
                    <p className="text-sm text-gray-300">{summary.admin_remarks}</p>
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

export default function WeeklySummaryPage() {
  return (
    <AppProvider>
      <AppShell role="admin" title="Weekly Summaries" breadcrumbs={[{ label: 'Admin' }, { label: 'Weekly Summaries' }]}>
        <WeeklySummaryContent />
      </AppShell>
    </AppProvider>
  )
}