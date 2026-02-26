'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Permission = {
  id: string
  role: string
  resource: string
  can_create: boolean
  can_read: boolean
  can_update: boolean
  can_delete: boolean
  access_level: string
  field_restrictions: string[]
}

export default function PermissionsPage() {
  const router = useRouter()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editingRestrictions, setEditingRestrictions] = useState<string | null>(null)
  const [restrictionInput, setRestrictionInput] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else fetchPermissions()
    })
  }, [])

  async function fetchPermissions() {
    const supabase = createClient()
    const { data } = await supabase.from('role_permissions').select('*').order('role')
    setPermissions((data || []).map(p => ({ ...p, field_restrictions: p.field_restrictions || [] })))
    setLoading(false)
  }

  async function updateField(id: string, field: string, value: unknown) {
    setSaving(id)
    const supabase = createClient()
    const { error } = await supabase.from('role_permissions').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) toast.error('Failed to update')
    else {
      toast.success('Updated!')
      setPermissions(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    }
    setSaving(null)
  }

  async function saveRestrictions(id: string) {
    const restrictions = restrictionInput.split(',').map(s => s.trim()).filter(Boolean)
    await updateField(id, 'field_restrictions', JSON.stringify(restrictions))
    setEditingRestrictions(null)
  }

  const actions: (keyof Permission)[] = ['can_create', 'can_read', 'can_update', 'can_delete']
  const actionLabels = ['Create', 'Read', 'Update', 'Delete']
  const roles = [...new Set(permissions.map(p => p.role))]

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
          <h1 className="text-xl font-bold text-blue-400">Permission Matrix</h1>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <p className="text-gray-400 mb-8">Configure CRUD permissions, module access level, and field-level edit restrictions per role.</p>

        {roles.map(role => (
          <div key={role} className="mb-12">
            <h2 className="text-lg font-bold mb-4">
              <span className={`px-3 py-1 rounded-full text-sm border ${
                role === 'admin' ? 'text-blue-400 border-blue-800' :
                role === 'intern' ? 'text-green-400 border-green-800' :
                'text-gray-400 border-gray-700'
              }`}>{role}</span>
            </h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-3 text-sm text-gray-400">Resource</th>
                    <th className="text-left px-4 py-3 text-sm text-gray-400">Access Level</th>
                    {actionLabels.map(a => (
                      <th key={a} className="text-center px-3 py-3 text-sm text-gray-400">{a}</th>
                    ))}
                    <th className="text-left px-4 py-3 text-sm text-gray-400">Field Restrictions</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.filter(p => p.role === role).map((perm, i) => (
                    <tr key={perm.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'}>
                      <td className="px-6 py-4 font-mono text-sm text-blue-300">{perm.resource}</td>
                      <td className="px-4 py-4">
                        <select
                          value={perm.access_level || 'full'}
                          onChange={e => updateField(perm.id, 'access_level', e.target.value)}
                          disabled={saving === perm.id}
                          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="full">Full</option>
                          <option value="read_only">Read Only</option>
                          <option value="none">No Access</option>
                        </select>
                      </td>
                      {actions.map(action => (
                        <td key={action} className="text-center px-3 py-4">
                          <button
                            onClick={() => updateField(perm.id, action, !perm[action])}
                            disabled={saving === perm.id}
                            className={`w-8 h-8 rounded-full border-2 transition-all text-sm ${
                              perm[action] ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'
                            }`}
                          >
                            {perm[action] ? '✓' : '✗'}
                          </button>
                        </td>
                      ))}
                      <td className="px-4 py-4">
                        {editingRestrictions === perm.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={restrictionInput}
                              onChange={e => setRestrictionInput(e.target.value)}
                              placeholder="cohort, bio, skills"
                              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-32"
                            />
                            <button onClick={() => saveRestrictions(perm.id)} className="text-green-400 text-xs hover:text-green-300">✓</button>
                            <button onClick={() => setEditingRestrictions(null)} className="text-red-400 text-xs hover:text-red-300">✗</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingRestrictions(perm.id)
                              setRestrictionInput((perm.field_restrictions || []).join(', '))
                            }}
                            className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2 py-1 rounded transition-colors"
                          >
                            {(perm.field_restrictions || []).length > 0
                              ? (perm.field_restrictions || []).join(', ')
                              : 'Set restrictions'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
