'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Rule = {
  id: string
  name: string
  trigger_type: string
  condition: { field: string; operator: string; value: string }
  action: { type: string; message: string }
  is_active: boolean
}

const ACTION_TYPES = ['restrict_login', 'lock_editing', 'notify_incomplete', 'disable_project_assignment']
const OPERATORS = ['equals', 'not_equals', 'is_null', 'is_not_null']
const TRIGGERS = ['intern_profile', 'project', 'task']

export default function WorkflowPage() {
  const router = useRouter()
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', trigger_type: 'intern_profile',
    field: '', operator: 'equals', value: '',
    actionType: 'notify_incomplete', actionMessage: ''
  })

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error || !data.user) {
        setLoading(false)
        router.push('/admin/login')
        return
      }
      fetchRules()
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        router.push('/admin/login')
      }
    })

    return () => { mounted = false }
  }, [])

  async function fetchRules() {
    const supabase = createClient()
    const { data } = await supabase.from('workflow_rules').select('*').order('created_at', { ascending: false })
    setRules(data || [])
    setLoading(false)
  }

  async function toggleRule(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('workflow_rules').update({ is_active: !current }).eq('id', id)
    setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r))
    toast.success(current ? 'Rule disabled' : 'Rule enabled')
  }

  async function deleteRule(id: string) {
    if (!confirm('Delete this workflow rule?')) return
    const supabase = createClient()
    await supabase.from('workflow_rules').delete().eq('id', id)
    setRules(prev => prev.filter(r => r.id !== id))
    toast.success('Rule deleted')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.field) { toast.error('Name and field are required'); return }
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('workflow_rules').insert([{
      name: form.name,
      trigger_type: form.trigger_type,
      condition: { field: form.field, operator: form.operator, value: form.value },
      action: { type: form.actionType, message: form.actionMessage || `Rule: ${form.name}` },
      is_active: true
    }]).select()
    if (error) { toast.error('Failed to create rule'); setSaving(false); return }
    setRules(prev => [data[0], ...prev])
    setForm({ name: '', trigger_type: 'intern_profile', field: '', operator: 'equals', value: '', actionType: 'notify_incomplete', actionMessage: '' })
    setShowForm(false)
    toast.success('Rule created!')
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/settings')} className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">← Settings</button>
          <h1 className="text-xl font-bold text-blue-400">Workflow Rules</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
          {showForm ? 'Cancel' : '+ New Rule'}
        </button>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        {showForm && (
          <form onSubmit={handleCreate} className="bg-gray-900 border border-blue-800 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-blue-400">Create Workflow Rule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Rule Name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Block incomplete profiles"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Trigger Type</label>
                <select value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Field *</label>
                <input required value={form.field} onChange={e => setForm({ ...form, field: e.target.value })}
                  placeholder="e.g. bio, approval_status"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Operator</label>
                <select value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Value (if applicable)</label>
                <input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                  placeholder="e.g. pending"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Action</label>
                <select value={form.actionType} onChange={e => setForm({ ...form, actionType: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-1 block">Action Message</label>
                <input value={form.actionMessage} onChange={e => setForm({ ...form, actionMessage: e.target.value })}
                  placeholder="e.g. Profile must be approved before login"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
              {saving ? 'Creating...' : 'Create Rule'}
            </button>
          </form>
        )}

        {rules.length === 0 ? (
          <div className="text-center py-20 border border-gray-800 rounded-xl">
            <div className="text-4xl mb-3">⚙️</div>
            <p className="text-gray-400 font-medium mb-1">No workflow rules yet</p>
            <p className="text-gray-500 text-sm">Click "+ New Rule" to define your first workflow rule.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <div key={rule.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white">{rule.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${rule.is_active ? 'text-green-400 border-green-800' : 'text-gray-500 border-gray-700'}`}>
                        {rule.is_active ? 'active' : 'disabled'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 font-mono">
                      IF {rule.trigger_type}.{rule.condition?.field} {rule.condition?.operator} {rule.condition?.value || '—'} → {rule.action?.type}
                    </div>
                    {rule.action?.message && (
                      <p className="text-xs text-gray-500 mt-1 italic">"{rule.action.message}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleRule(rule.id, rule.is_active)}
                      className={`text-xs px-3 py-1.5 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${rule.is_active ? 'text-yellow-400 border-yellow-800 hover:border-yellow-600' : 'text-green-400 border-green-800 hover:border-green-600'}`}>
                      {rule.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => deleteRule(rule.id)}
                      className="text-xs text-red-400 border border-red-800 hover:border-red-600 px-3 py-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
