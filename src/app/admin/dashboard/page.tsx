'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider, useApp } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import toast from 'react-hot-toast'

type Intern = { id: string; full_name: string; cohort: string; skills: string[]; approval_status: string; is_active: boolean }
type Metrics = { totalUsers: number; activeInterns: number; totalProjects: number; pendingApprovals: number }

function DashboardContent() {
  const router = useRouter()
  const { config } = useApp()
  const [interns, setInterns] = useState<Intern[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ totalUsers: 0, activeInterns: 0, totalProjects: 0, pendingApprovals: 0 })
  const [widgets, setWidgets] = useState({ overview: true, interns: true, activity: true })
  const [features, setFeatures] = useState<Record<string, string>>({})
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ full_name: '', bio: '', cohort: '', skills: '' })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else loadAll()
    })
  }, [])

  useEffect(() => {
    setWidgets({ overview: config['widget_overview'] !== 'false', interns: config['widget_interns'] !== 'false', activity: config['widget_activity'] !== 'false' })
    setFeatures(config)
  }, [config])

  async function loadAll() {
    const supabase = createClient()
    const [{ count: userCount }, { count: activeCount }, { count: projectCount }, { count: pendingCount }, { data: internData }, { data: logData }] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('intern_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
      supabase.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('intern_profiles').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending').is('deleted_at', null),
      supabase.from('intern_profiles').select('id, full_name, cohort, skills, approval_status, is_active').is('deleted_at', null).order('created_at', { ascending: false }).limit(30),
      supabase.from('activity_logs').select('id, action, created_at').order('created_at', { ascending: false }).limit(8),
    ])
    setMetrics({ totalUsers: userCount || 0, activeInterns: activeCount || 0, totalProjects: projectCount || 0, pendingApprovals: pendingCount || 0 })
    setInterns((internData || []) as Intern[])
    setRecentLogs(logData || [])
    setLoading(false)
  }

  async function toggleConfig(key: string, current: string) {
    const newVal = current === 'true' ? 'false' : 'true'
    setFeatures(prev => ({ ...prev, [key]: newVal }))
    await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value: newVal }) })
    toast.success('Updated')
  }

  async function handleApprove(id: string) {
    const supabase = createClient()
    await supabase.from('intern_profiles').update({ approval_status: 'active', is_active: true }).eq('id', id)
    toast.success('Approved')
    setInterns(prev => prev.map(i => i.id === id ? { ...i, approval_status: 'active', is_active: true } : i))
    setMetrics(prev => ({ ...prev, pendingApprovals: Math.max(0, prev.pendingApprovals - 1), activeInterns: prev.activeInterns + 1 }))
  }

  async function handleReject(id: string) {
    const supabase = createClient()
    await supabase.from('intern_profiles').update({ approval_status: 'rejected', is_active: false }).eq('id', id)
    toast.success('Rejected')
    setInterns(prev => prev.map(i => i.id === id ? { ...i, approval_status: 'rejected', is_active: false } : i))
    setMetrics(prev => ({ ...prev, pendingApprovals: Math.max(0, prev.pendingApprovals - 1) }))
  }

  async function handleDelete(id: string) {
    if (!confirm('Soft delete this intern?')) return
    const res = await fetch(`/api/interns/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete' }) })
    if (res.ok) { toast.success('Deleted'); setInterns(prev => prev.filter(i => i.id !== id)); setMetrics(prev => ({ ...prev, activeInterns: Math.max(0, prev.activeInterns - 1) })) }
    else toast.error('Failed')
  }

  async function handleAddIntern(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim() || !form.cohort.trim()) { toast.error('Name and cohort required'); return }
    setSubmitting(true)
    const res = await fetch('/api/interns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: form.full_name, bio: form.bio || null, cohort: form.cohort, skills: form.skills.split(',').map((s: string) => s.trim()).filter(Boolean) }) })
    if (res.ok) { toast.success('Intern added'); setForm({ full_name: '', bio: '', cohort: '', skills: '' }); setShowForm(false); loadAll() }
    else { const err = await res.json(); toast.error(err.error || 'Failed') }
    setSubmitting(false)
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-900 text-green-300 border-green-700',
    pending: 'bg-yellow-900 text-yellow-300 border-yellow-700',
    rejected: 'bg-red-900 text-red-300 border-red-700',
  }

  const featureToggles = [{ key: 'feature_interns', label: 'Interns Module' }, { key: 'feature_projects', label: 'Projects Module' }, { key: 'feature_tasks', label: 'Tasks Module' }]
  const widgetToggles = [{ key: 'widget_overview', label: 'Overview Cards' }, { key: 'widget_interns', label: 'Interns Table' }, { key: 'widget_activity', label: 'Activity Feed' }]

  return (
    <div className="space-y-8">
      {widgets.overview && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">System Overview</h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-24" />)}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: metrics.totalUsers, color: 'text-blue-400' },
                { label: 'Active Interns', value: metrics.activeInterns, color: 'text-green-400' },
                { label: 'Total Projects', value: metrics.totalProjects, color: 'text-purple-400' },
                { label: 'Pending', value: metrics.pendingApprovals, color: metrics.pendingApprovals > 0 ? 'text-yellow-400' : 'text-gray-500' },
              ].map(card => (
                <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                  <p className="text-gray-400 text-xs mb-2">{card.label}</p>
                  <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-gray-300 text-sm mb-4">Module Toggles</h2>
          <div className="space-y-3">
            {featureToggles.map(ft => (
              <div key={ft.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{ft.label}</span>
                <button onClick={() => toggleConfig(ft.key, features[ft.key] || 'true')} aria-label={`Toggle ${ft.label}`}
                  className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${features[ft.key] !== 'false' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${features[ft.key] !== 'false' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="font-semibold text-gray-300 text-sm mb-4">Dashboard Widgets</h2>
          <div className="space-y-3">
            {widgetToggles.map(wt => (
              <div key={wt.key} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{wt.label}</span>
                <button onClick={() => toggleConfig(wt.key, features[wt.key] || 'true')} aria-label={`Toggle ${wt.label}`}
                  className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${features[wt.key] !== 'false' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${features[wt.key] !== 'false' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {widgets.interns && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-base font-semibold text-gray-300">
              Manage Interns
              {metrics.pendingApprovals > 0 && <span className="ml-2 text-xs bg-yellow-900 text-yellow-300 border border-yellow-700 px-2 py-0.5 rounded-full">{metrics.pendingApprovals} pending</span>}
            </h2>
            <div className="flex items-center gap-3">
              <a href="/api/export/interns" className="text-xs text-green-400 hover:text-green-300 border border-green-800 px-3 py-1.5 rounded-lg transition-colors">Export CSV</a>
              <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">{showForm ? 'Cancel' : '+ Add Intern'}</button>
            </div>
          </div>
          {showForm && (
            <form onSubmit={handleAddIntern} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[{ label: 'Full Name *', field: 'full_name', placeholder: 'Jane Smith' }, { label: 'Cohort *', field: 'cohort', placeholder: '2026' }, { label: 'Skills (comma separated)', field: 'skills', placeholder: 'React, TypeScript' }, { label: 'Bio', field: 'bio', placeholder: 'Short description' }].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="text-sm text-gray-400 mb-1 block">{label}</label>
                  <input placeholder={placeholder} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form[field as keyof typeof form]} onChange={e => setForm({ ...form, [field]: e.target.value })} />
                </div>
              ))}
              <div className="md:col-span-2">
                <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg font-medium transition-colors">
                  {submitting ? 'Saving...' : 'Save Intern'}
                </button>
              </div>
            </form>
          )}
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 animate-pulse h-16" />)}</div>
          ) : interns.length === 0 ? (
            <div className="text-center py-16 border border-gray-800 rounded-xl">
              <p className="text-gray-400 font-medium">No interns yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {interns.map(intern => (
                <div key={intern.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3.5 flex items-center justify-between hover:border-gray-600 transition-colors flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">{intern.full_name[0]?.toUpperCase()}</div>
                    <div>
                      <p className="font-medium text-sm">{intern.full_name}</p>
                      <p className="text-xs text-gray-400">{intern.cohort}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[intern.approval_status] || 'bg-gray-800 text-gray-400 border-gray-600'}`}>{intern.approval_status}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(intern.skills || []).slice(0, 2).map(s => <span key={s} className="bg-gray-800 text-blue-400 text-xs px-2 py-0.5 rounded-full hidden md:inline">{s}</span>)}
                    <button onClick={() => handleApprove(intern.id)} className="text-green-400 text-xs border border-green-800 px-2 py-1 rounded hover:border-green-600 transition-colors">Approve</button>
                    <button onClick={() => handleReject(intern.id)} className="text-yellow-400 text-xs border border-yellow-800 px-2 py-1 rounded hover:border-yellow-600 transition-colors">Reject</button>
                    <button onClick={() => handleDelete(intern.id)} className="text-red-400 text-xs border border-red-800 px-2 py-1 rounded hover:border-red-600 transition-colors">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {widgets.activity && recentLogs.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-300 mb-4">Recent Activity</h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {recentLogs.map((log, i) => (
              <div key={log.id || i} className={`px-5 py-3 flex items-center justify-between text-sm ${i < recentLogs.length - 1 ? 'border-b border-gray-800' : ''}`}>
                <span className="text-gray-300">{log.action}</span>
                <span className="text-gray-500 text-xs whitespace-nowrap ml-4">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  return (
    <AppProvider>
      <AppShell role="admin" title="Dashboard" breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}>
        <DashboardContent />
      </AppShell>
    </AppProvider>
  )
}
