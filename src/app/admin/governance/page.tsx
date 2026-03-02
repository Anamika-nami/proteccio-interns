'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Policy = {
  id: string
  name: string
  description: string
  policy_type: string
  condition_field: string
  condition_op: string
  condition_value: string
  action: string
  is_active: boolean
  priority: number
}

type DataControl = {
  id: string
  control_key: string
  control_value: string
  label: string
}

type ConsentStats = {
  total: number
  version_v1: number
  last7days: number
}

type SensitiveMetrics = {
  total_interns: number
  has_bio: number
  has_skills: number
  classified_sensitive: number
}

export default function GovernancePage() {
  const router = useRouter()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [controls, setControls] = useState<DataControl[]>([])
  const [consentStats, setConsentStats] = useState<ConsentStats>({ total: 0, version_v1: 0, last7days: 0 })
  const [metrics, setMetrics] = useState<SensitiveMetrics>({ total_interns: 0, has_bio: 0, has_skills: 0, classified_sensitive: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'governance' | 'policies' | 'controls'>('governance')
  const [showNewPolicy, setShowNewPolicy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newPolicy, setNewPolicy] = useState({
    name: '', description: '', policy_type: 'export_approval',
    condition_field: '', condition_op: 'equals', condition_value: '', action: 'require_approval', priority: 10
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else loadAll()
    })
  }, [])

  async function loadAll() {
    const [policiesRes, controlsRes, consentRes, internRes, sensitiveRes] = await Promise.all([
      fetch('/api/policies'),
      fetch('/api/data-controls'),
      createClient().from('consent_logs').select('consented_at, version'),
      createClient().from('intern_profiles').select('bio, skills', { count: 'exact' }).is('deleted_at', null),
      createClient().from('form_fields').select('classification').eq('is_active', true),
    ])

    if (policiesRes.ok) setPolicies(await policiesRes.json())
    if (controlsRes.ok) setControls(await controlsRes.json())

    const { data: consents } = consentRes
    const now = new Date()
    const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    setConsentStats({
      total: consents?.length || 0,
      version_v1: consents?.filter((c: any) => c.version === 'v1').length || 0,
      last7days: consents?.filter((c: any) => new Date(c.consented_at) > week).length || 0,
    })

    const { data: interns, count } = internRes
    const { data: fields } = sensitiveRes
    setMetrics({
      total_interns: count || 0,
      has_bio: interns?.filter((i: any) => i.bio).length || 0,
      has_skills: interns?.filter((i: any) => i.skills?.length > 0).length || 0,
      classified_sensitive: fields?.filter((f: any) => f.classification === 'sensitive').length || 0,
    })
    setLoading(false)
  }

  async function togglePolicy(id: string, current: boolean) {
    const res = await fetch('/api/policies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current })
    })
    if (res.ok) {
      setPolicies(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
      toast.success('Policy updated')
    } else toast.error('Failed')
  }

  async function saveNewPolicy() {
    setSaving(true)
    const res = await fetch('/api/policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPolicy)
    })
    if (res.ok) {
      const created = await res.json()
      setPolicies(prev => [...prev, created])
      setShowNewPolicy(false)
      setNewPolicy({ name: '', description: '', policy_type: 'export_approval', condition_field: '', condition_op: 'equals', condition_value: '', action: 'require_approval', priority: 10 })
      toast.success('Policy created')
    } else toast.error('Failed')
    setSaving(false)
  }

  async function updateControl(key: string, value: string) {
    const res = await fetch('/api/data-controls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ control_key: key, control_value: value })
    })
    if (res.ok) {
      setControls(prev => prev.map(c => c.control_key === key ? { ...c, control_value: value } : c))
      toast.success('Updated')
    } else toast.error('Failed')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-gray-800 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-blue-400">Privacy Governance</h1>
          <p className="text-xs text-gray-500">Policies, Controls & Compliance Metrics</p>
        </div>
        <button onClick={() => router.push('/admin/dashboard')}
          className="text-sm text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1">
          Back to Dashboard
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Tab Nav */}
        <div className="flex gap-2 border-b border-gray-800">
          {([
            { key: 'governance', label: 'Governance Metrics' },
            { key: 'policies', label: 'Policy Engine' },
            { key: 'controls', label: 'Data Processing Controls' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none ${tab === t.key ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Governance Metrics */}
        {tab === 'governance' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Consent Statistics</h2>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-24" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Consents', value: consentStats.total, color: 'text-blue-400' },
                    { label: 'Consented (v1)', value: consentStats.version_v1, color: 'text-green-400' },
                    { label: 'New (Last 7 Days)', value: consentStats.last7days, color: 'text-purple-400' },
                  ].map(card => (
                    <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                      <p className="text-gray-400 text-xs mb-2">{card.label}</p>
                      <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Sensitive Data Usage</h2>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-24" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Active Interns', value: metrics.total_interns, color: 'text-blue-400' },
                    { label: 'Have Bio (personal data)', value: metrics.has_bio, color: 'text-yellow-400' },
                    { label: 'Have Skills Listed', value: metrics.has_skills, color: 'text-green-400' },
                    { label: 'Sensitive-Classified Fields', value: metrics.classified_sensitive, color: 'text-red-400' },
                  ].map(card => (
                    <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                      <p className="text-gray-400 text-xs mb-2">{card.label}</p>
                      <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Data Retention Status</h2>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {[
                  { label: 'Intern profiles (post-deletion)', period: '90 days', status: 'Configured', color: 'text-green-400' },
                  { label: 'Contact messages', period: '180 days', status: 'Configured', color: 'text-green-400' },
                  { label: 'Activity logs', period: '365 days', status: 'Configured', color: 'text-green-400' },
                  { label: 'Consent records', period: 'Indefinite', status: 'Audit-required', color: 'text-yellow-400' },
                ].map((row, i) => (
                  <div key={row.label} className={`px-5 py-3.5 flex items-center justify-between ${i < 3 ? 'border-b border-gray-800' : ''}`}>
                    <div>
                      <p className="text-sm text-gray-200">{row.label}</p>
                      <p className="text-xs text-gray-500">Retention: {row.period}</p>
                    </div>
                    <span className={`text-xs font-medium ${row.color}`}>{row.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Policy Engine */}
        {tab === 'policies' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-200">Policy Engine</h2>
                <p className="text-xs text-gray-500 mt-1">Rules evaluated against records to enforce compliance behavior.</p>
              </div>
              <button onClick={() => setShowNewPolicy(!showNewPolicy)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                {showNewPolicy ? 'Cancel' : '+ New Policy'}
              </button>
            </div>

            {showNewPolicy && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-300">Create Policy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Policy Name', key: 'name', placeholder: 'e.g. Block Sensitive Export' },
                    { label: 'Description', key: 'description', placeholder: 'What does this policy do?' },
                    { label: 'Condition Field', key: 'condition_field', placeholder: 'e.g. classification' },
                    { label: 'Condition Value', key: 'condition_value', placeholder: 'e.g. sensitive' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                      <input placeholder={placeholder}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={(newPolicy as any)[key]}
                        onChange={e => setNewPolicy({ ...newPolicy, [key]: e.target.value })} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Policy Type</label>
                    <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newPolicy.policy_type}
                      onChange={e => setNewPolicy({ ...newPolicy, policy_type: e.target.value })}>
                      <option value="export_approval">Export Approval</option>
                      <option value="auto_disable">Auto Disable</option>
                      <option value="auto_expire">Auto Expire</option>
                      <option value="data_access">Data Access</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Operator</label>
                    <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newPolicy.condition_op}
                      onChange={e => setNewPolicy({ ...newPolicy, condition_op: e.target.value })}>
                      {['equals', 'not_equals', 'greater_than', 'less_than', 'days_since', 'is_null', 'is_not_null'].map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Action</label>
                    <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newPolicy.action}
                      onChange={e => setNewPolicy({ ...newPolicy, action: e.target.value })}>
                      {['require_approval', 'block', 'disable_account', 'expire_profile', 'notify_only'].map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={saveNewPolicy} disabled={saving || !newPolicy.name}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {saving ? 'Saving...' : 'Create Policy'}
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-20" />)}
              </div>
            ) : policies.length === 0 ? (
              <div className="text-center py-16 border border-gray-800 rounded-xl">
                <p className="text-gray-400">No policies yet. Create your first policy above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {policies.map(policy => (
                  <div key={policy.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-start justify-between gap-4 hover:border-gray-600 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-gray-100">{policy.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${policy.is_active ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-500'}`}>
                          {policy.is_active ? 'Active' : 'Disabled'}
                        </span>
                        <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">{policy.policy_type}</span>
                      </div>
                      <p className="text-xs text-gray-400">{policy.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        When <span className="text-blue-400">{policy.condition_field}</span> {policy.condition_op} <span className="text-yellow-400">{policy.condition_value}</span> → <span className="text-red-400">{policy.action}</span>
                      </p>
                    </div>
                    <button onClick={() => togglePolicy(policy.id, policy.is_active)}
                      aria-label={`Toggle ${policy.name}`}
                      className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0 ${policy.is_active ? 'bg-blue-600' : 'bg-gray-600'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${policy.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Data Processing Controls */}
        {tab === 'controls' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-200">Data Processing Controls</h2>
              <p className="text-xs text-gray-500 mt-1">Fine-grained controls over what data operations are permitted. Enforced at backend level.</p>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-16" />)}
              </div>
            ) : controls.length === 0 ? (
              <div className="text-center py-16 border border-gray-800 rounded-xl">
                <p className="text-gray-400">No data controls configured. Run the Day 11 SQL to seed defaults.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {controls.map(control => {
                  const isBool = control.control_value === 'true' || control.control_value === 'false'
                  const isNum = !isNaN(Number(control.control_value)) && control.control_value !== 'true' && control.control_value !== 'false'
                  return (
                    <div key={control.control_key} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between hover:border-gray-600 transition-colors">
                      <div>
                        <p className="text-sm text-gray-200">{control.label || control.control_key}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">{control.control_key}</p>
                      </div>
                      {isBool ? (
                        <button
                          onClick={() => updateControl(control.control_key, control.control_value === 'true' ? 'false' : 'true')}
                          aria-label={`Toggle ${control.label}`}
                          className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${control.control_value === 'true' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${control.control_value === 'true' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      ) : isNum ? (
                        <input type="number" min={0}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm w-20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={control.control_value}
                          onChange={e => updateControl(control.control_key, e.target.value)} />
                      ) : (
                        <input type="text"
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm w-36 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={control.control_value}
                          onChange={e => updateControl(control.control_key, e.target.value)} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
