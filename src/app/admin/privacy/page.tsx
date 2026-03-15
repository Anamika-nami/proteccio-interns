'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type FormField = {
  id: string
  field_key: string
  field_label: string
  visibility: string
  classification: string
}

const CLASSIFICATIONS = ['public', 'internal', 'confidential', 'sensitive']
const VISIBILITIES = ['public', 'intern_only', 'admin_only', 'masked']
const classColors: Record<string, string> = {
  public: 'text-green-400 border-green-800',
  internal: 'text-blue-400 border-blue-800',
  confidential: 'text-yellow-400 border-yellow-800',
  sensitive: 'text-red-400 border-red-800',
}

export default function PrivacyDashboard() {
  const router = useRouter()
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [retentionValues, setRetentionValues] = useState<Record<string, string>>({})
  const [retentionKeys, setRetentionKeys] = useState<{key: string; label: string}[]>([])
  const [savingRetention, setSavingRetention] = useState<string | null>(null)

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
      fetchData()
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        router.push('/admin/login')
      }
    })

    return () => { mounted = false }
  }, [])

  async function fetchData() {
    const supabase = createClient()
    const [{ data: fieldData }, { data: configData }] = await Promise.all([
      supabase.from('form_fields').select('id, field_key, field_label, visibility, classification').order('sort_order'),
      supabase.from('app_config').select('key, value, label').ilike('key', 'retention_%')
    ])
    setFields(fieldData || [])
    const cfg = configData || []
    setRetentionKeys(cfg.map(c => ({ key: c.key, label: c.label })))
    const vals: Record<string, string> = {}
    cfg.forEach(c => { vals[c.key] = c.value })
    setRetentionValues(vals)
    setLoading(false)
  }

  async function updateField(id: string, key: string, value: string) {
    setSaving(id + key)
    const supabase = createClient()
    const { error } = await supabase.from('form_fields').update({ [key]: value }).eq('id', id)
    if (error) toast.error('Failed')
    else {
      toast.success('Updated!')
      setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f))
    }
    setSaving(null)
  }

  async function saveRetention(key: string) {
    setSavingRetention(key)
    const res = await fetch('/api/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: retentionValues[key] })
    })
    if (res.ok) toast.success('Saved!')
    else toast.error('Failed')
    setSavingRetention(null)
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
          <h1 className="text-xl font-bold text-blue-400">Privacy Dashboard</h1>
        </div>
        <a href="/api/export/consent-logs"
          className="text-sm text-green-400 hover:text-green-300 border border-green-800 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500">
          Export Consent Logs
        </a>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div>
          <h2 className="text-xl font-bold mb-1">Field Classification & Visibility</h2>
          <p className="text-gray-400 text-sm mb-5">Classification overrides visibility for sensitive/confidential fields.</p>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-3 text-sm text-gray-400">Field</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Classification</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Visibility</th>
                </tr>
              </thead>
              <tbody>
                {fields.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500 text-sm">No form fields yet. Add them in Form Builder.</td></tr>
                ) : fields.map((field, i) => (
                  <tr key={field.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'}>
                    <td className="px-6 py-3">
                      <p className="font-medium text-sm">{field.field_label}</p>
                      <p className="text-xs font-mono text-gray-500">{field.field_key}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select value={field.classification || 'public'}
                        onChange={e => updateField(field.id, 'classification', e.target.value)}
                        disabled={saving === field.id + 'classification'}
                        className={`bg-gray-800 border rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${classColors[field.classification] || 'border-gray-700'}`}>
                        {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select value={field.visibility || 'public'}
                        onChange={e => updateField(field.id, 'visibility', e.target.value)}
                        disabled={saving === field.id + 'visibility'}
                        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {VISIBILITIES.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {retentionKeys.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-1">Data Retention Periods</h2>
            <p className="text-gray-400 text-sm mb-5">Days each data type is retained after deletion.</p>
            <div className="space-y-3">
              {retentionKeys.map(({ key, label }) => (
                <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs font-mono text-gray-500">{key}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" min="1" max="3650"
                      value={retentionValues[key] || '90'}
                      onChange={e => setRetentionValues(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <span className="text-gray-400 text-sm">days</span>
                    <button onClick={() => saveRetention(key)} disabled={savingRetention === key}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {savingRetention === key ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
