'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

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
      else loadAll()
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
      supabase.from('intern_profiles').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending').is('deleted_at', null),
      supabase.from('intern_profiles').select('id, full_name, cohort, skills, approval_status, is_active').is('deleted_at', null).order('created_at', { ascending: false }).limit(30),
      supabase.from('app_config').select('key, value'),
      supabase.from('activity_logs').select('id, action, created_at').order('created_at', { ascending: false }).limit(8)
    ])

    setMetrics({ totalUsers: userCount || 0, activeInterns: activeCount || 0, totalProjects: projectCount || 0, pendingApprovals: pendingCount || 0 })
    setInterns((internData || []) as Intern[])
    setRecentLogs(logData || [])

    const cfg: Record<string, string> = {}
    ;(configData || []).forEach((c: any) => { cfg[c.key] = c.value })
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
    if (!form.full_name.trim()) { toast.error('Full name required'); return }
    if (!form.cohort.trim()) { toast.error('Cohort required'); return }
    setSubmitting(true)
    const res = await fetch('/api/interns', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name, bio: form.bio || null, cohort: form.cohort,
        skills: form.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
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

  const statusColors: Record<string, string> = {
    active: 'bg-green-900 text-green-300 border-green-700',
    pending: 'bg-yellow-900 text-yellow-300 border-yellow-700',
    rejected: 'bg-red-900 text-red-300 border-red-700',
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

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-gray-800 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-blue-400">{appName} Admin</h1>
          