'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'

type Tab = 'metrics' | 'policies' | 'controls'

function GovernanceContent() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('metrics')
  const [metrics, setMetrics] = useState({ totalConsents: 0, activeInterns: 0, sensitiveFields: 0 })
  const [policies, setPolicies] = useState<any[]>([])
  const [controls, setControls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
      loadAll()
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        router.push('/admin/login')
      }
    })

    return () => { mounted = false }
  }, [])

  async function loadAll() {
    const supabase = createClient()
    const [{ count: consents }, { count: interns }, { count: sensitive }, policiesRes, controlsRes] = await Promise.all([
      supabase.from('consent_logs').select('*', { count: 'exact', head: true }),
      supabase.from('intern_profiles').select('*', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
      supabase.from('form_fields').select('*', { count: 'exact', head: true }).eq('classification', 'sensitive'),
      fetch('/api/policies').then(r => r.json()),
      fetch('/api/data-controls').then(r => r.json()),
    ])
    setMetrics({ totalConsents: consents || 0, activeInterns: interns || 0, sensitiveFields: sensitive || 0 })
    setPolicies(Array.isArray(policiesRes) ? policiesRes : [])
    setControls(Array.isArray(controlsRes) ? controlsRes : [])
    setLoading(false)
  }

  async function toggleControl(key: string, current: string) {
    const newVal = current === 'true' ? 'false' : 'true'
    setControls(prev => prev.map(c => c.control_key === key ? { ...c, control_value: newVal } : c))
    await fetch('/api/data-controls', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ control_key: key, control_value: newVal })
    })
  }

  async function togglePolicy(id: string, current: boolean) {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
    await fetch('/api/policies', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current })
    })
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'metrics', label: 'Governance Metrics' },
    { id: 'policies', label: 'Policy Engine' },
    { id: 'controls', label: 'Data Controls' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-800">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t ${tab === t.id ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Consents', value: metrics.totalConsents, color: 'text-blue-400' },
              { label: 'Active Interns', value: metrics.activeInterns, color: 'text-green-400' },
              { label: 'Sensitive Fields', value: metrics.sensitiveFields, color: 'text-yellow-400' },
            ].map(m => (
              <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="text-xs text-gray-400 mb-2">{m.label}</p>
                <p className={`text-3xl font-bold ${m.color}`}>{loading ? '...' : m.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-300 text-sm mb-4">Data Retention Policy</h3>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Intern Profiles', value: '90 days post-deletion' },
                { label: 'Contact Messages', value: '180 days' },
                { label: 'Activity Logs', value: '365 days' },
                { label: 'Consent Records', value: 'Indefinite (audit-required)' },
              ].map(r => (
                <div key={r.label} className="flex justify-between py-2 border-b border-gray-800 last:border-0">
                  <span className="text-gray-400">{r.label}</span>
                  <span className="text-gray-200">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'policies' && (
        <div className="space-y-3">
          {policies.length === 0 && !loading && (
            <div className="text-center py-16 border border-gray-800 rounded-xl">
              <p className="text-gray-400">No policies yet. Add policies via the API or seed the database.</p>
            </div>
          )}
          {policies.map(policy => (
            <div key={policy.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm text-gray-200">{policy.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{policy.description || `${policy.condition_field} ${policy.condition_op} ${policy.condition_value} → ${policy.action}`}</p>
              </div>
              <button onClick={() => togglePolicy(policy.id, policy.is_active)}
                className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${policy.is_active ? 'bg-blue-600' : 'bg-gray-600'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${policy.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'controls' && (
        <div className="space-y-3">
          {controls.map(control => (
            <div key={control.control_key} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm text-gray-200">{control.label || control.control_key}</p>
                <p className="text-xs text-gray-500">{control.control_key}</p>
              </div>
              {control.control_value === 'true' || control.control_value === 'false' ? (
                <button onClick={() => toggleControl(control.control_key, control.control_value)}
                  className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${control.control_value === 'true' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${control.control_value === 'true' ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              ) : (
                <span className="text-sm text-gray-300 bg-gray-800 px-3 py-1 rounded">{control.control_value}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GovernancePage() {
  return (
    <AppProvider>
      <AppShell role="admin" title="Governance" breadcrumbs={[{ label: 'Admin' }, { label: 'Governance' }]}>
        <GovernanceContent />
      </AppShell>
    </AppProvider>
  )
}
