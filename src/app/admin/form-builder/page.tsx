'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Field = {
  id: string
  field_key: string
  field_label: string
  field_type: string
  is_required: boolean
  is_active: boolean
  visibility: string
  sort_order: number
  options: string[] | null
}

const FIELD_TYPES = ['text', 'email', 'textarea', 'dropdown', 'date']
const VISIBILITY_OPTIONS = ['public', 'intern_only', 'admin_only', 'masked']

export default function FormBuilder() {
  const router = useRouter()
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [newField, setNewField] = useState({
    field_key: '', field_label: '', field_type: 'text',
    is_required: false, visibility: 'public', options: ''
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else fetchFields()
    })
  }, [])

  async function fetchFields() {
    const res = await fetch('/api/form-fields?form=intern_profile')
    const data = await res.json()
    setFields(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function handleToggle(field: Field, key: 'is_required' | 'is_active') {
    setSaving(field.id)
    const res = await fetch('/api/form-fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: field.id, [key]: !field[key] })
    })
    if (res.ok) {
      toast.success('Updated!')
      setFields(prev => prev.map(f => f.id === field.id ? { ...f, [key]: !field[key] } : f))
    } else toast.error('Failed to update')
    setSaving(null)
  }

  async function handleVisibility(field: Field, visibility: string) {
    setSaving(field.id)
    const res = await fetch('/api/form-fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: field.id, visibility })
    })
    if (res.ok) {
      toast.success('Visibility updated!')
      setFields(prev => prev.map(f => f.id === field.id ? { ...f, visibility } : f))
    } else toast.error('Failed to update')
    setSaving(null)
  }

  async function handleAddField(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/form-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newField,
        options: newField.options ? newField.options.split(',').map(s => s.trim()) : null,
        sort_order: fields.length
      })
    })
    if (res.ok) {
      toast.success('Field added!')
      setNewField({ field_key: '', field_label: '', field_type: 'text', is_required: false, visibility: 'public', options: '' })
      setShowAdd(false)
      fetchFields()
    } else toast.error('Failed to add field')
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
          <h1 className="text-xl font-bold text-blue-400">Form Builder</h1>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          {showAdd ? 'Cancel' : '+ Add Field'}
        </button>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-gray-400 mb-8">Configure the intern profile form. Changes reflect immediately — no redeployment needed.</p>

        {showAdd && (
          <form onSubmit={handleAddField} className="bg-gray-900 border border-blue-800 rounded-xl p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Field Key (no spaces) *</label>
              <input required placeholder="e.g. github_url"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                value={newField.field_key}
                onChange={e => setNewField({ ...newField, field_key: e.target.value.replace(/\s/g, '_').toLowerCase() })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Field Label *</label>
              <input required placeholder="e.g. GitHub URL"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                value={newField.field_label}
                onChange={e => setNewField({ ...newField, field_label: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Field Type *</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                value={newField.field_type}
                onChange={e => setNewField({ ...newField, field_type: e.target.value })}
              >
                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Visibility</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                value={newField.visibility}
                onChange={e => setNewField({ ...newField, visibility: e.target.value })}
              >
                {VISIBILITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            {newField.field_type === 'dropdown' && (
              <div className="md:col-span-2">
                <label className="text-sm text-gray-400 mb-1 block">Options (comma separated)</label>
                <input placeholder="Option 1, Option 2, Option 3"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={newField.options}
                  onChange={e => setNewField({ ...newField, options: e.target.value })}
                />
              </div>
            )}
            <div className="md:col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newField.is_required}
                  onChange={e => setNewField({ ...newField, is_required: e.target.checked })}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm text-gray-300">Required field</span>
              </label>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors ml-auto">
                Add Field
              </button>
            </div>
          </form>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-sm text-gray-400">Field</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Type</th>
                <th className="text-left px-4 py-3 text-sm text-gray-400">Visibility</th>
                <th className="text-center px-4 py-3 text-sm text-gray-400">Required</th>
                <th className="text-center px-4 py-3 text-sm text-gray-400">Active</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, i) => (
                <tr key={field.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'}>
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{field.field_label}</p>
                    <p className="text-xs text-gray-500 font-mono">{field.field_key}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="bg-gray-800 text-blue-400 text-xs px-2 py-1 rounded-full">{field.field_type}</span>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={field.visibility || 'public'}
                      onChange={e => handleVisibility(field, e.target.value)}
                      disabled={saving === field.id}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {VISIBILITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </td>
                  <td className="text-center px-4 py-4">
                    <button
                      onClick={() => handleToggle(field, 'is_required')}
                      disabled={saving === field.id}
                      className={`w-8 h-8 rounded-full border-2 transition-all text-sm ${
                        field.is_required ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'
                      }`}
                    >
                      {field.is_required ? '✓' : '○'}
                    </button>
                  </td>
                  <td className="text-center px-4 py-4">
                    <button
                      onClick={() => handleToggle(field, 'is_active')}
                      disabled={saving === field.id}
                      className={`relative w-10 h-5 rounded-full transition-colors ${field.is_active ? 'bg-green-600' : 'bg-gray-600'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${field.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
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
