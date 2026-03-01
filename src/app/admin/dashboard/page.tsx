'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import StatusBadge from '@/components/ui/StatusBadge'
import SkeletonLoader from '@/components/ui/SkeletonLoader'
import EmptyState from '@/components/ui/EmptyState'

type Intern = {
  id: string
  full_name: string
  cohort: string
  skills: string[]
  approval_status: string
  is_active: boolean
}

type Metrics = {
  totalUsers: number
  activeInterns: number
  totalProjects: number
  pendingApprovals: number
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [interns, setInterns] = useState<Intern[]>([])
  const [metrics, setMetrics] = useState<Metrics>({ totalUsers: 0, activeInterns: 0, totalProjects: 0, pendingApprovals: 0 })
  const [features, setFeatures] = useState<Record<string, string>>({})
  const [widgets, setWidgets] = useState({ overview: true, interns: true, activity: true })
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ full_name: '', bio: '', cohort: '', skills: '' })
  const [appName, setAppName] = useState('Proteccio')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else { setUser(data.user); loadAll() }
    })
  }, [])

  async function loadAll() {
    const supabase = createClient()
    const [
      { count: userCount },
      { count: activeCount },
      { count: projectCount },
      { count: pendingCount },
      { data: internData },
      { data: configData },
      { data: logData }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('intern_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
      supabase.from('projects').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabase.from('intern_profiles').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
      supabase.from('intern_profiles').select('id, full_name, cohort, skills, approval_status, is_active').is('deleted_at', null).order('created_at', { ascending: false }).limit(30),
      supabase.from('app_config').select('key, value'),
      supabase.from('activity_logs').select('id, action, created_at').order('created_at', { ascending: false }).limit(8)
    ])

    setMetrics({ totalUsers: userCount || 0, activeInterns: activeCount || 0, totalProjects: projectCount || 0, pendingApprovals: pendingCount || 0 })
    setInterns((internData || []) as Intern[])
    setRecentLogs(logData || [])

    const cfg: Record<string, string> = {}
    ;(configData || []).forEach(c => { cfg[c.key] = c.value })
    setFeatures(cfg)
    if (cfg['app_name']) setAppName(cfg['app_name'])
    setWidgets({
      overview: cfg['widget_overview'] !== 'false',
      interns: cfg['widget_interns'] !== 'false',
      activity: cfg['widget_activity'] !== 'false',
    })
    setLoading(false)
  }

  async function toggleConfig(key: string, current: string) {
    const newVal = current === 'true' ? 'false' : 'true'
    setFeatures(prev => ({ ...prev, [key]: newVal }))
    if (key === 'widget_overview') setWidgets(prev => ({ ...prev, overview: newVal === 'true' }))
    if (key === 'widget_interns') setWidgets(prev => ({ ...prev, interns: newVal === 'true' }))
    if (key === 'widget_activity') setWidgets(prev => ({ ...prev, activity: newVal === 'true' }))
    const res = await fetch('/api/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: newVal })
    })
    if (res.ok) toast.success('Updated')
    else toast.error('Failed')
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
    const res = await fetch(`/api/interns/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete' })
    })
    if (res.ok) {
      toast.success('Deleted')
      setInterns(prev => prev.filter(i => i.id !== id))
      setMetrics(prev => ({ ...prev, activeInterns: Math.max(0, prev.activeInterns - 1) }))
    } else toast.error('Failed')
  }

  async function handleAddIntern(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.error('Full name is required'); return }
    if (!form.cohort.trim()) { toast.error('Cohort is required'); return }
    setSubmitting(true)
    const res = await fetch('/api/interns', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name, bio: form.bio || null, cohort: form.cohort,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      }),
    })
    if (res.ok) {
      toast.success('Intern added')
      setForm({ full_name: '', bio: '', cohort: '', skills: '' })
      setShowForm(false)
      loadAll()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
    }
    setSubmitting(false)
  }

  const featureToggles = [
    { key: 'feature_interns', label: 'Interns Module' },
    { key: 'feature_projects', label: 'Projects Module' },
    { key: 'feature_tasks', label: 'Tasks Module' },
  ]
  const widgetToggles = [
    { key: 'widget_overview', label: 'Overview Cards' },
    { key: 'widget_interns', label: 'Interns Table' },
    { key: 'widget_activity', label: 'Activity Feed' },
  ]

  if (!user) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-gray-800 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-blue-400">{appName} Admin</h1>
          <p className="text-xs text-gray-500">Control Panel</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: 'Settings', path: '/admin/settings' },
            { label: 'Workflow', path: '/admin/workflow' },
            { label: 'Privacy', path: '/admin/privacy' },
            { label: 'Deleted', path: '/admin/deleted' },
            { label: 'Consent', path: '/admin/consent-logs' },
            { label: 'Logs', path: '/admin/logs' },
          ].map(({ label, path }) => (
            <button key={path} onClick={() => router.push(path)}
              className="text-sm text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 transition-colors">
              {label}
            </button>
          ))}
          <button onClick={async () => { const s = createClient(); await s.auth.signOut(); router.push('/admin/login') }}
            className="text-sm text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1 transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {widgets.overview && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">System Overview</h2>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-24" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: metrics.totalUsers, color: 'text-blue-400', border: 'hover:border-blue-800' },
                  { label: 'Active Interns', value: metrics.activeInterns, color: 'text-green-400', border: 'hover:border-green-800' },
                  { label: 'Total Projects', value: metrics.totalProjects, color: 'text-purple-400', border: 'hover:border-purple-800' },
                  { label: 'Pending Approvals', value: metrics.pendingApprovals, color: metrics.pendingApprovals > 0 ? 'text-yellow-400' : 'text-gray-500', border: 'hover:border-yellow-800' },
                ].map(card => (
                  <div key={card.label} className={`bg-gray-900 border border-gray-800 rounded-xl p-5 transition-colors ${card.border}`}>
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
                  <button onClick={() => toggleConfig(ft.key, features[ft.key] || 'true')}
                    aria-label={`Toggle ${ft.label}`}
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
                  <button onClick={() => toggleConfig(wt.key, features[wt.key] || 'true')}
                    aria-label={`Toggle ${wt.label}`}
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
                {metrics.pendingApprovals > 0 && (
                  <span className="ml-2 text-xs bg-yellow-900 text-yellow-300 border border-yellow-700 px-2 py-0.5 rounded-full">
                    {metrics.pendingApprovals} pending
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3">
                <a href="/api/export/interns"
                  className="text-xs text-green-400 hover:text-green-300 border border-green-800 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500">
                  Export CSV
                </a>
                <button onClick={() => setShowForm(!showForm)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {showForm ? 'Cancel' : '+ Add Intern'}
                </button>
              </div>
            </div>

            {showForm && (
              <form onSubmit={handleAddIntern} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name *', field: 'full_name', placeholder: 'Jane Smith' },
                  { label: 'Cohort *', field: 'cohort', placeholder: '2026' },
                  { label: 'Skills (comma separated)', field: 'skills', placeholder: 'React, TypeScript' },
                  { label: 'Bio', field: 'bio', placeholder: 'Short description' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label className="text-sm text-gray-400 mb-1 block">{label}</label>
                    <input placeholder={placeholder}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form[field as keyof typeof form]}
                      onChange={e => setForm({ ...form, [field]: e.target.value })} />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <button type="submit" disabled={submitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {submitting ? 'Saving...' : 'Save Intern'}
                  </button>
                </div>
              </form>
            )}

            {loading ? <SkeletonLoader count={4} type="row" /> :
              interns.length === 0 ? <EmptyState title="No interns yet" description='Click Add Intern to get started.' /> : (
                <div className="space-y-2">
                  {interns.map(intern => (
                    <div key={intern.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3.5 flex items-center justify-between hover:border-gray-600 transition-colors flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {intern.full_name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{intern.full_name}</p>
                          <p className="text-xs text-gray-400">{intern.cohort}</p>
                        </div>
                        <StatusBadge status={intern.approval_status || 'pending'} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(intern.skills || []).slice(0, 2).map(s => (
                          <span key={s} className="bg-gray-800 text-blue-400 text-xs px-2 py-0.5 rounded-full hidden md:inline">{s}</span>
                        ))}
                        <button onClick={() => handleApprove(intern.id)} className="text-green-400 hover:text-green-300 text-xs border border-green-800 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-500">Approve</button>
                        <button onClick={() => handleReject(intern.id)} className="text-yellow-400 hover:text-yellow-300 text-xs border border-yellow-800 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500">Reject</button>
                        <button onClick={() => handleDelete(intern.id)} className="text-red-400 hover:text-red-300 text-xs border border-red-800 px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {widgets.activity && recentLogs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-300">Recent Activity</h2>
              <button onClick={() => router.push('/admin/logs')} className="text-sm text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">View all</button>
            </div>
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

      </section>
    </main>
  )
}
