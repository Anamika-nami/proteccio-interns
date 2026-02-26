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
}

export default function PermissionsPage() {
  const router = useRouter()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else fetchPermissions()
    })
  }, [])

  async function fetchPermissions() {
    const supabase = createClient()
    const { data } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role')
    setPermissions(data || [])
    setLoading(false)
  }

  async function togglePermission(id: string, field: keyof Permission, current: boolean) {
    const supabase = createClient()
    const { error } = await supabase
      .from('role_permissions')
      .update({ [field]: !current, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update permission')
    } else {
      toast.success('Permission updated!')
      setPermissions(prev =>
        prev.map(p => p.id === id ? { ...p, [field]: !current } : p)
      )
    }
  }

  const actions: (keyof Permission)[] = ['can_create', 'can_read', 'can_update', 'can_delete']
  const actionLabels = ['Create', 'Read', 'Update', 'Delete']

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  )

  const roles = [...new Set(permissions.map(p => p.role))]

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/settings')} className="text-gray-400 hover:text-white text-sm">← Settings</button>
          <h1 className="text-xl font-bold text-blue-400">Permission Matrix</h1>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-gray-400 mb-8">Control what each role can do on each resource. Changes take effect immediately.</p>

        {roles.map(role => (
          <div key={role} className="mb-10">
            <h2 className="text-lg font-bold mb-4 capitalize">
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
                    {actionLabels.map(a => (
                      <th key={a} className="text-center px-4 py-3 text-sm text-gray-400">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.filter(p => p.role === role).map((perm, i) => (
                    <tr key={perm.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'}>
                      <td className="px-6 py-4 font-mono text-sm text-blue-300">{perm.resource}</td>
                      {actions.map(action => (
                        <td key={action} className="text-center px-4 py-4">
                          <button
                            onClick={() => togglePermission(perm.id, action, perm[action] as boolean)}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              perm[action]
                                ? 'bg-green-600 border-green-500 text-white'
                                : 'bg-gray-800 border-gray-700 text-gray-600'
                            }`}
                          >
                            {perm[action] ? '✓' : '✗'}
                          </button>
                        </td>
                      ))}
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
