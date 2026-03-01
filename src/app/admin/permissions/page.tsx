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
  access_level: string | null
  field_restrictions: string[] | null
}

const ROLES = ['admin', 'intern', 'public']
const roleColors: Record<string, string> = {
  admin: 'bg-blue-900 text-blue-300 border-blue-700',
  intern: 'bg-green-900 text-green-300 border-green-700',
  public: 'bg-gray-800 text-gray-400 border-gray-600',
}
const ACCESS_LEVELS = ['Full', 'Read Only', 'No Access']

export default function PermissionsPage() {
  const router = useRouter()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [editRestrictions, setEditRestrictions] = useState<string | null>(null)
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
    const { data } = await supabase.from('role_permissions').select('*').order('role').order('resource')
    setPermissions(data || [])
    setLoading(false)
  }

  async function updatePerm(id: string, field: string, value: unknown) {
    setUpdating(id + field)
    const supabase = createClient()
    const { error } = await supabase.from('role_permissions').update({ [field]: value }).eq('id', id)
    if (error) toast.error('Failed to update')
    else {
      toast.success('Updated!')
      setPermissions(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    }
    setUpdating(null)
  }

  async function saveRestrictions(id: string) {
    const arr = restrictionInput.split(',').map(s => s.trim()).filter(Boolean)
    await updatePerm(id, 'field_restrictions', arr.length > 0 ? arr : null)
    setEditRestrictions(null)
  }

  const grouped = ROLES.map(role => ({
    role,
    perms: permissions.filter(p => p.role === role)
  })).filter(g => g.perms.length > 0)

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
          <h1 className="text-xl font-bold text-blue-400">Permissions Matrix</h1>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {grouped.map(({ role, perms }) => (
          <div key={role}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleColors[role] || 'bg-gray-800 text-gray-400 border-gray-600'}`}>{role}</span>
              <span className="text-gray-500 text-sm">{perms.length} resource{perms.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-3 text-sm text-gray-400">Resource</th>
                    <th className="text-center px-3 py-3 text-sm text-gray-400">Create</th>
                    <th className="text-center px-3 py-3 text-sm text-gray-400">Read</th>
                    <th className="text-center px-3 py-3 text-sm text-gray-400">Update</th>
                    <th className="text-center px-3 py-3 text-sm text-gray-400">Delete</th>
                    <th className="text-left px-3 py-3 text-sm text-gray-400">Access Level</th>
                    <th className="text-left px-3 py-3 text-sm text-gray-400">Field Restrictions</th>
                  </tr>
                </thead>
                <tbody>
                  {perms.map((perm, i) => (
                    <tr key={perm.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'}>
                      <td className="px-6 py-3 font-medium text-sm text-white">{perm.resource}</td>
                      {(['can_create', 'can_read', 'can_update', 'can_delete'] as const).map(action => (
                        <td key={action} className="text-center px-3 py-3">
                          <input type="checkbox" checked={perm[action]}
                            onChange={e => updatePerm(perm.id, action, e.target.checked)}
                            disabled={updating === perm.id + action}
                            className="w-4 h-4 accent-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <select value={perm.access_level || 'Full'}
                          onChange={e => updatePerm(perm.id, 'access_level', e.target.value)}
                          disabled={updating === perm.id + 'access_level'}
                          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {ACCESS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        {editRestrictions === perm.id ? (
                          <div className="flex items-center gap-1">
                            <input value={restrictionInput}
                              onChange={e => setRestrictionInput(e.target.value)}
                              placeholder="bio, skills"
                              className="w-28 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <button onClick={() => saveRestrictions(perm.id)} className="text-green-400 text-xs px-1 focus:outline-none focus:ring-1 focus:ring-green-500 rounded">✓</button>
                            <button onClick={() => setEditRestrictions(null)} className="text-gray-500 text-xs px-1 focus:outline-none">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditRestrictions(perm.id); setRestrictionInput((perm.field_restrictions || []).join(', ')) }}
                            className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2 py-0.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {perm.field_restrictions?.length ? perm.field_restrictions.join(', ') : 'Set restrictions'}
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
