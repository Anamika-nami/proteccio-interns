'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type DeletedIntern = {
  id: string
  full_name: string
  cohort: string
  deleted_at: string
  deleted_by: string | null
}

export default function DeletedPage() {
  const router = useRouter()
  const [interns, setInterns] = useState<DeletedIntern[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)

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
      fetchDeleted()
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        router.push('/admin/login')
      }
    })

    return () => { mounted = false }
  }, [])

  async function fetchDeleted() {
    const supabase = createClient()
    const { data } = await supabase
      .from('intern_profiles')
      .select('id, full_name, cohort, deleted_at, deleted_by')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
    setInterns(data || [])
    setLoading(false)
  }

  async function handleRestore(id: string) {
    setRestoring(id)
    const res = await fetch(`/api/interns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore' })
    })
    if (res.ok) {
      toast.success('Intern restored!')
      setInterns(prev => prev.filter(i => i.id !== id))
    } else toast.error('Failed to restore')
    setRestoring(null)
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
          <button onClick={() => router.push('/admin/dashboard')} className="text-gray-400 hover:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">← Dashboard</button>
          <h1 className="text-xl font-bold text-blue-400">Deleted Records</h1>
        </div>
        <span className="text-sm text-gray-500">{interns.length} records</span>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-10">
        {interns.length === 0 ? (
          <div className="text-center py-20 border border-gray-800 rounded-xl">
            <div className="text-4xl mb-3">🗑️</div>
            <p className="text-gray-400 font-medium mb-1">No deleted records</p>
            <p className="text-gray-500 text-sm">Soft-deleted interns will appear here for restoration.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {interns.map(intern => (
              <div key={intern.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between hover:border-gray-600 transition-colors flex-wrap gap-3">
                <div>
                  <p className="font-medium">{intern.full_name}</p>
                  <p className="text-sm text-gray-400">{intern.cohort}</p>
                  <p className="text-xs text-red-400 mt-0.5">Deleted {new Date(intern.deleted_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleRestore(intern.id)} disabled={restoring === intern.id}
                  className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500">
                  {restoring === intern.id ? 'Restoring...' : 'Restore'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
