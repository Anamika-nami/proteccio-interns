'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Rule = {
  id: string
  name: string
  trigger_type: string
  condition: { field: string; operator: string; value: unknown }
  action: { type: string; message: string }
  is_active: boolean
}

export default function WorkflowPage() {
  const router = useRouter()
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    name: '', trigger_type: 'intern_profile',
    condition_field: '', condition_operator: 'equals', condition_value: '',
    action_type: 'restrict_login', action_message: ''
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else fetchRules()
    })
  }, [])

  async function fetchRules() {
    const supabase = createClient()
    const { data } = await supabase.from('workflow_rules').select('*').order('created_at')
    setRules(data || [])
    setLoading(false)
  }

  async function toggleRule(id: string, current: boolean) {
    setToggling(id)
    const supabase = createClient()
    const { error } = await supabase.from('workflow_rules').update({ is_active: !current }).eq('id', id)
    if (error) toast.error('Failed to update rule')
    else {
      toast.success(`Rule ${!current ? 'enabled' : 'disabled'}`)
      setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !current } : r))
    }
    setToggling(null)
  }

  async function addRule(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const { error } = await supabase.from('workflow_rules').insert([{
      name: form.name,
      trigger_type: form.trigger_type,
      condition: { field: form.condition_field, operator: form.condition_operator, value: form.condition_value },
      action: { type: form.action_type, message: form.action_message }
    }])
    if (error) toast.error('Failed to add rule')
    else {
      toast.success('Rule added!')
      setShowAdd(false)
      setForm({ name: '', trigger_type: 'intern_profile', condition_field: '', condition_operator: 'equals', condition_value: '', action_type: 'restrict_login', action_message: '' })
      fetchRules()
    }
  }

  const actionLabels: Record<string, string> = {
    restrict_login: '🚫 Restrict Login',
    disable_project_assignment: '📁 Disable Project Assignment',
    lock_editing: '🔒 Lock Editing',
    notify_incomplete: '🔔 Notify Incomplete'
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
          <button onClick={() => router.push('/admin/settings')} className="text-gray-400 hover:text-white text-sm">← Settings</button>
          <h1 className="text-xl font-bold text-blue-400">Workflow Rules</h1>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          {showAdd ? 'Cancel' : '+ Add Rule'}
        </button>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-gray-400 mb-8">Rules are evaluated automatically when records change. Enable or disable them without code changes.</p>

        {showAdd && (
          <form onSubmit={addRule} className="bg-gray-900 border border-blue-800 rounded-xl p-6 mb-8 space-y-4">
            <h2 className="font-bold text-lg mb-4">New Rule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Rule Name *</label>
                <input required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Trigger Type</label>
                <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={form.trigger_type} onChange={e => setForm({ ...form, trigger_type: e.target.value })}>
                  <option value="intern_profile">Intern Profile</option>
                  <option value="task">Task</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Condition Field *</label>
                <input required placeholder="e.g. approval_status" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={form.condition_field} onChange={e => setForm({ ...form, condition_field: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Operator</label>
                <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={form.condition_operator} onChange={e => setForm({ ...form, condition_operator: e.target.value })}>
                  <option value="equals">equals</option>
                  <option value="not_equals">not equals</option>
                  <option value="is_null">is empty</option>
                  <option value="is_not_null">is not empty</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Condition Value</label>
                <input placeholder="e.g. rejected" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={form.condition_value} onChange={e => setForm({ ...form, condition_value: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Action Type</label>
                <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={form.action_type} onChange={e => setForm({ ...form, action_type: e.target.value })}>
                  <option value="restrict_login">Restrict Login</option>
                  <option value="disable_project_assignment">Disable Project Assignment</option>
                  <option value="lock_editing">Lock Editing</option>
                  <option value="notify_incomplete">Notify Incomplete</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-1 block">Action Message *</label>
                <input required placeholder="Message shown when rule triggers" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={form.action_message} onChange={e => setForm({ ...form, action_message: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors">
              Add Rule
            </button>
          </form>
        )}

        <div className="space-y-4">
          {rules.map(rule => (
            <div key={rule.id} className={`bg-gray-900 border rounded-xl p-5 transition-colors ${rule.is_active ? 'border-gray-700' : 'border-gray-800 opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{rule.name}</h3>
                    <span className="bg-gray-800 text-blue-400 text-xs px-2 py-0.5 rounded-full">{rule.trigger_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-2 flex-wrap">
                    <span className="bg-gray-800 px-2 py-0.5 rounded font-mono text-xs">{rule.condition.field}</span>
                    <span className="text-gray-600">{rule.condition.operator}</span>
                    <span className="bg-gray-800 px-2 py-0.5 rounded font-mono text-xs">{String(rule.condition.value)}</span>
                    <span className="text-gray-600 mx-1">→</span>
                    <span className="text-yellow-400 text-xs">{actionLabels[rule.action.type] || rule.action.type}</span>
                  </div>
                  <p className="text-xs text-gray-500 italic">&quot;{rule.action.message}&quot;</p>
                </div>
                <button
                  onClick={() => toggleRule(rule.id, rule.is_active)}
                  disabled={toggling === rule.id}
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${rule.is_active ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${rule.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
