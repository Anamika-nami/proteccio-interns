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
}

type RetentionConfig = {
  key: string
  label: string
  value: string
}

export default function PrivacyDashboard() {
  const router = useRouter()
  const [fields, setFields] = useState<FormField[]>([])
  const [retention, setRetention] = useState<RetentionConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [savingRetention, setSavingRetention] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else fetchData()
    })
  }, [])

  async function fetchData() {
    const supabase = createClient()
    const [{ data: fieldData }, { data: configData }] = await Promise.all([
      supabase.from('form_fields').select('id, field_key, field_label, visibility').order('sort_order'),
      supabase.from('app_config').select('key, value, label').in('key', ['retention_intern_days', 'retention_contact_days', 'retention_logs_days'])
    ])
    setFields(fieldData || [])
    setRetention((configData || []) as RetentionConfig[])
    setLoading(false)
  }

  async function toggleVisibility(field: FormField) {
    const newVis = field.visibility === 'masked' ? 'public' : 'masked'
    const supabase = createClient()
    const { error } = await supabase.from('form_fields').update({ visibility: newVis }).eq('id', field.id)
    if (error) toast.error('Failed to update')
    else {
      toast.success(`${field.field_label} masking ${newVis === 'masked' ? 'enabled' : 'disabled'}`)
      setFields(prev => prev.map(f => f.id === field.id ? { ...f, visibility: newVis } : f))
    }
  }

  async function saveRetention(key: string, value: string) {
    setSavingRetention(key)
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    })
    if (res.ok) toast.success('Retention period saved!')
    else toast.error('Failed to save')
    setSavingRetention(null)
  }

  const visibilityColor: Record<string, string> = {
    public: 'text-green-400 border-green-800',
    intern_only: 'text-blue-400 border-blue-800',
    admin_only: 'text-red-400 border-red-800',
    masked: 'text-yellow-400 border-yellow-800'
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
          <h1 className="text-xl font-bold text-blue-400">Privacy Dashboard</h1>
        </div>
        <a href="/api/export/consent-logs" className="text-sm text-green-400 hover:text-green-300 border border-green-800 px-3 py-1.5 rounded-lg transition-colors">
          Export Consent Logs CSV
        </a>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-12 space-y-12">

        {/* Field Sensitivity */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Field Visibility & Masking</h2>
          <p className="text-gray-400 text-sm mb-6">Control what each field shows to different roles. Toggle masking to partially hide sensitive values.</p>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-3 text-sm text-gray-400">Field</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Current Visibility</th>
                  <th className="text-center px-4 py-3 text-sm text-gray-400">Masking</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, i) => (
                  <tr key={field.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'}>
                    <td className="px-6 py-4">
                      <p className="font-medium">{field.field_label}</p>
                      <p className="text-xs font-mono text-gray-500">{field.field_key}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full border ${visibilityColor[field.visibility] || 'text-gray-400 border-gray-700'}`}>
                        {field.visibility}
                      </span>
                    </td>
                    <td className="text-center px-4 py-4">
                      <button
                        onClick={() => toggleVisibility(field)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${field.visibility === 'masked' ? 'bg-yellow-600' : 'bg-gray-600'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.visibility === 'masked' ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Retention Periods */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Data Retention Periods</h2>
          <p className="text-gray-400 text-sm mb-6">Set how many days each data category is retained after deletion.</p>
          <div className="space-y-4">
            {retention.map(config => (
              <div key={config.key} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{config.label}</p>
                  <p className="text-xs font-mono text-gray-500">{config.key}</p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min="1" max="3650"
                    defaultValue={config.value}
                    onBlur={e => { config.value = e.target.value }}
                    className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-center"
                  />
                  <span className="text-gray-400 text-sm">days</span>
                  <button
                    onClick={() => saveRetention(config.key, config.value)}
                    disabled={savingRetention === config.key}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {savingRetention === config.key ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </main>
  )
}
