'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type ConfigItem = {
  key: string
  value: string
  type: string
  label: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [localValues, setLocalValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else fetchConfig()
    })
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: localValues[key] })
    })
    if (res.ok) toast.success('Setting saved!')
    else toast.error('Failed to save setting')
    setSaving(null)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  )

  const featureKeys = configs.filter(c => c.type === 'boolean')
  const otherKeys = configs.filter(c => c.type !== 'boolean')

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/dashboard')} className="text-gray-400 hover:text-white text-sm">← Dashboard</button>
          <h1 className="text-xl font-bold text-blue-400">App Settings</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/form-builder')} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Form Builder →
          </button>
          <button onClick={() => router.push('/admin/deleted')} className="text-sm text-red-400 hover:text-red-300 transition-colors">
            Deleted Records →
          </button>
          <button onClick={() => router.push('/admin/permissions')} className="text-sm text-gray-400 hover:text-white transition-colors">
            Permissions →
          </button>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        <div>
          <h2 className="text-2xl font-bold mb-6">General Settings</h2>
          <div className="space-y-4">
            {otherKeys.map(config => (
              <div key={config.key} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <label className="text-sm text-gray-400 mb-2 block">{config.label}</label>
                <div className="flex gap-3 items-center">
                  {config.type === 'color' ? (
                    <div className="flex items-center gap-3 flex-1">
                      <input type="color"
                        value={localValues[config.key] || '#2563EB'}
                        onChange={e => setLocalValues(prev => ({ ...prev, [config.key]: e.target.value }))}
                        className="w-12 h-10 rounded cursor-pointer bg-transparent border-0"
                      />
                      <input type="text"
                        value={localValues[config.key] || ''}
                        onChange={e => setLocalValues(prev => ({ ...prev, [config.key]: e.target.value }))}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <input type="text"
                      value={localValues[config.key] || ''}
                      onChange={e => setLocalValues(prev => ({ ...prev, [config.key]: e.target.value }))}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  )}
                  <button onClick={() => handleSave(config.key)} disabled={saving === config.key}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    {saving === config.key ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2">Feature Toggles</h2>
          <p className="text-gray-400 text-sm mb-6">Enable or disable modules across the entire application.</p>
          <div className="space-y-3">
            {featureKeys.map(config => (
              <div key={config.key} className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{config.label}</p>
                  <p className="text-sm text-gray-500">{config.key}</p>
                </div>
                <button
                  onClick={async () => {
                    const newVal = localValues[config.key] === 'true' ? 'false' : 'true'
                    setLocalValues(prev => ({ ...prev, [config.key]: newVal }))
                    const res = await fetch('/api/config', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: config.key, value: newVal })
                    })
                    if (res.ok) toast.success(`${config.label} ${newVal === 'true' ? 'enabled' : 'disabled'}`)
                    else toast.error('Failed to update')
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors ${localValues[config.key] === 'true' ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${localValues[config.key] === 'true' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
