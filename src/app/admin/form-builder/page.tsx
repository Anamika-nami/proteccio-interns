'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type FormField = {
  id: string
  field_key: string
  field_label: string
  field_type: string
  is_required: boolean
  is_active: boolean
  visibility: string
  classification: string
  sort_order: number
}

const FIELD_TYPES = ['text', 'textarea', 'email', 'url', 'select', 'multiselect', 'date']
const VISIBILITIES = ['public', 'intern_only', 'admin_only', 'masked']
const CLASSIFICATIONS = ['public', 'internal', 'confidential', 'sensitive']

export default function FormBuilderPage() {
  const router = useRouter()
  const [fields, setFields] = useState<FormField[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [newField, setNewField] = useState({
    field_key: '', field_label: '', field_type: 'text',
    is_required: false, visibility: 'intern_only', classification: 'public'
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
      fetchFields()
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        router.push('/admin/login')
      }
    })

    return () => { mounted = false }
  }, [])

  async function fetchFields() {
    const supabase = createClient()
    const { data } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_name', 'intern_profile')
      .order('sort_order')
    setFields(data || [])
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newField.field_key || !newField.field_label) { toast.error('Key and label are required'); return }
    setSaving(true)
    const res = await fetch('/api/form-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newField, form_name: 'intern_profile', sort_order: fields.length + 1 })
    })
    if (res.ok) {
      const created = await res.json()
      setFields(prev => [...prev, created])
      setNewField({ field_key: '', field_label: '', field_type: 'text', is_required: false, visibility: 'intern_only', classification: 'public' })
      setShowForm(false)
      toast.success('Field created!')
    } else toast.error('Failed to create field')
    setSaving(false)
  }

  async function updateField(id: string, key: string, value: unknown) {
    setUpdating(id + key)
    const res = await fetch('/api/form-fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [key]: value })
    })
    if (res.ok) {
      toast.success('Updated!')
      setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f))
    } else toast.error('Failed')
    setUpdating(null)
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
          <h1 className="text-xl font-bold text-blue-400">Form Builder</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
          {showForm ? 'Cancel' : '+ Add Field'}
        </button>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        {showForm && (
          <form onSubmit={handleCreate} className="bg-gray-900 border border-blue-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="md:col-span-2 font-semibold text-blue-400">New Field</h2>
            {[
              { label: 'Field Key *', field: 'field_key', placeholder: 'e.g. linkedin_url' },
              { label: 'Field Label *', field: 'field_label', placeholder: 'e.g. LinkedIn URL' },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="text-sm text-gray-400 mb-1 block">{label}</label>
                <input required placeholder={placeholder}
                  value={newField[field as keyof typeof newField] as string}
                  onChange={e => setNewField({ ...newField, [field]: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            {[
              { label: 'Field Type', field: 'field_type', options: FIELD_TYPES },
              { label: 'Visibility', field: 'visibility', options: VISIBILITIES },
              { label: 'Classification', field: 'classification', options: CLASSIFICATIONS },
            ].map(({ label, field, options }) => (
              <div key={field}>
                <label className="text-sm text-gray-400 mb-1 block">{label}</label>
                <select value={newField[field as keyof typeof newField] as string}
                  onChange={e => setNewField({ ...newField, [field]: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <input type="checkbox" id="required" checked={newField.is_required}
                onChange={e => setNewField({ ...newField, is_required: e.target.checked })}
                className="w-4 h-4 focus:ring-2 focus:ring-blue-500" />
              <label htmlFor="required" className="text-sm text-gray-300">Required field</label>
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                {saving ? 'Creating...' : 'Create Field'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-sm text-gray-400">Field</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Type</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Visibility</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Classification</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Active</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, i) => (
                <tr key={field.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'}>
                  <td className="px-6 py-3">
                    <p className="font-medium text-sm">{field.field_label}</p>
                    <p className="text-xs font-mono text-gray-500">{field.field_key}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{field.field_type}</td>
                  <td className="px-4 py-3">
                    <select value={field.visibility}
                      onChange={e => updateField(field.id, 'visibility', e.target.value)}
                      disabled={updating === field.id + 'visibility'}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {VISIBILITIES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={field.classification || 'public'}
                      onChange={e => updateField(field.id, 'classification', e.target.value)}
                      disabled={updating === field.id + 'classification'}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => updateField(field.id, 'is_active', !field.is_active)}
                      aria-label={`Toggle ${field.field_label}`}
                      className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${field.is_active ? 'bg-blue-600' : 'bg-gray-600'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${field.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
