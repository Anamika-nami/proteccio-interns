'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Intern = {
  id: string
  full_name: string
  bio: string
  skills: string[]
  cohort: string
  is_active: boolean
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [interns, setInterns] = useState<Intern[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ full_name: '', bio: '', cohort: '', skills: '' })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else { setUser(data.user); fetchInterns() }
    })
  }, [])

  async function fetchInterns() {
    const res = await fetch('/api/interns?status=active&limit=50')
    const json = await res.json()
    setInterns(json.data || [])
    setLoading(false)
  }

  async function handleAddIntern(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const res = await fetch('/api/interns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name,
        bio: form.bio,
        cohort: form.cohort,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        user_id: user?.id,
      }),
    })

    if (res.ok) {
      toast.success('Intern added successfully!')
      setForm({ full_name: '', bio: '', cohort: '', skills: '' })
      setShowForm(false)
      fetchInterns()
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed to add intern')
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to deactivate this intern?')) return
    const supabase = createClient()
    const { error } = await supabase
      .from('intern_profiles')
      .update({ is_active: false })
      .eq('id', id)

    if (error) toast.error('Failed to deactivate intern')
    else { toast.success('Intern deactivated'); fetchInterns() }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (!user) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <h1 className="text-xl font-bold text-blue-400">Admin Dashboard</h1>
        <div className="flex items-center gap-6">
          <span className="text-sm text-gray-400">{user.email}</span>
          <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 py-12">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Interns', value: interns.length },
            { label: 'Active Interns', value: interns.filter(i => i.is_active).length },
            { label: 'Cohorts', value: [...new Set(interns.map(i => i.cohort))].length },
          ].map(card => (
            <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">{card.label}</p>
              <p className="text-4xl font-bold text-blue-400">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Interns Table */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Manage Interns</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Intern'}
          </button>
        </div>

        {/* Add Intern Form */}
        {showForm && (
          <form onSubmit={handleAddIntern} className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Full Name *</label>
              <input required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Cohort *</label>
              <input required placeholder="e.g. 2026"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                value={form.cohort} onChange={e => setForm({ ...form, cohort: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Skills (comma separated)</label>
              <input placeholder="React, TypeScript, Node.js"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })}
              />
            </div>
            <div>
              
            </div>