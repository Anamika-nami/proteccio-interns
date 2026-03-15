'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type ConfigItem = { key: string; value: string; type: string; label: string }

function ToggleRow({ config, value, onToggle }: { config: ConfigItem; value: string; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-200">{config.label}</p>
        <p className="text-xs text-gray-500 font-mono">{config.key}</p>
      </div>
      <button onClick={onToggle} aria-label={`Toggle ${config.label}`}
        className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${value === 'true' ? 'bg-blue-600' : 'bg-gray-600'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value === 'true' ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [localValues, setLocalValues] = useState<Record<string, string>>({})

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
      fetchConfig()
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        router.push('/admin/login')
      }
    })

    return () => { mounted = false }
  }, [])

  async function fetchConfig() {
    const supabase = createClient()
    const { data } = await supabase.from('app_config').select('*').order('key')
    if (data) {
      setConfigs(data)
      const vals: Record<string, string> = {}
      data.forEach(c => { vals[c.key] = c.value })
      setLocalValues(vals)
    }
    setLoading(false)
  }

  async function handleSave(key: string) {
    setSaving(key)
    const res = await fetch('/api/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: localValues[key] })
    })
    if (res.ok) toast.success('Saved!')
    else toast.error('Failed to save')
    setSaving(null)
  }

  async function toggleBoolean(key: string) {
    const newVal = localValues[key] === 'true' ? 'false' : 'true'
    setLocalValues(prev => ({ ...prev, [key]: newVal }))
    const res = await fetch('/api/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: newVal })
    })
    if (res.ok) toast.success(newVal === 'true' ? 'Enabled' : 'Disabled')
    else toast.error('Failed')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  )

  const featureToggles = configs.filter(c => c.key.startsWith('feature_'))
  const approvalToggles = configs.filter(c => c.key.startsWith('require_'))
  const widgetToggles = configs.filter(c => c.key.startsWith('widget_') && c.type === 'boolean')
  const otherKeys = configs.filter(c => c.type !== 'boolean' && !c.key.startsWith('widget_') && !c.key.startsWith('retention_'))

  const adminPages = [
    { label: '⚙️ Workflow Rules', path: '/admin/workflow' },
    { label: '🔒 Privacy Dashboard', path: '/admin/privacy' },
    { label: '🏗️ Form Builder', path: '/admin/form-builder' },
    { label: '🗑️ Deleted Records', path: '/admin/deleted' },
    { label: '📋 Consent Logs', path: '/admin/consent-logs' },
    { label: '🛡️ Permissions', path: '/admin/permissions' },
  ]

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/dashboard')} className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">← Dashboard</button>
          <h1 className="text-xl font-bold text-blue-400">App Settings</h1>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-12 space-y-10">

        <div>
          <h2 className="text-xl font-bold mb-4">Admin Tools</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {adminPages.map(p => (
              <button key={p.path} onClick={() => router.push(p.path)}
                className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-left text-sm font-medium hover:border-blue-600 hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {otherKeys.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">General Settings</h2>
            <div className="space-y-4">
              {otherKeys.map(config => (
                <div key={config.key} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <label className="text-sm text-gray-400 mb-2 block">{config.label}</label>
                  <div className="flex gap-3 items-center">
                    {config.type === 'color' ? (
                      <div className="flex items-center gap-3 flex-1">
                        <input type="color" value={localValues[config.key] || '#2563EB'}
                          onChange={e => setLocalValues(prev => ({ ...prev, [config.key]: e.target.value }))}
                          className="w-12 h-10 rounded cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="text" value={localValues[config.key] || ''}
                          onChange={e => setLocalValues(prev => ({ ...prev, [config.key]: e.target.value }))}
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    ) : (
                      <input type="text" value={localValues[config.key] || ''}
                        onChange={e => setLocalValues(prev => ({ ...prev, [config.key]: e.target.value }))}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    )}
                    <button onClick={() => handleSave(config.key)} disabled={saving === config.key}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {saving === config.key ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-xl font-bold mb-1">Feature Modules</h2>
          <p className="text-gray-400 text-sm mb-4">Enable or disable entire modules.</p>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-2">
            {featureToggles.map(c => <ToggleRow key={c.key} config={c} value={localValues[c.key] || 'true'} onToggle={() => toggleBoolean(c.key)} />)}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-1">Approval Workflows</h2>
          <p className="text-gray-400 text-sm mb-4">Control what requires admin approval before activation.</p>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-2">
            {approvalToggles.length > 0
              ? approvalToggles.map(c => <ToggleRow key={c.key} config={c} value={localValues[c.key] || 'false'} onToggle={() => toggleBoolean(c.key)} />)
              : <p className="text-gray-500 text-sm py-4">Run the Day 9 SQL first.</p>
            }
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-1">Dashboard Widgets</h2>
          <p className="text-gray-400 text-sm mb-4">Show or hide dashboard sections.</p>
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-2">
            {widgetToggles.map(c => <ToggleRow key={c.key} config={c} value={localValues[c.key] || 'true'} onToggle={() => toggleBoolean(c.key)} />)}
          </div>
        </div>

      </section>
    </main>
  )
}
