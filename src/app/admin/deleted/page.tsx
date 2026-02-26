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
}

export default function DeletedRecords() {
  const router = useRouter()
  const [records, setRecords] = useState<DeletedIntern[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else fetchDeleted()
    })
  }, [])

  async function fetchDeleted() {
    const supabase = createClient()
    const { data } = await supabase
      .from('intern_profiles')
      .select('id, full_name, cohort, deleted_at')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
    setRecords(data || [])
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
      toast.success('Intern restored successfully!')
      setRecords(prev => prev.filter(r => r.id !== id))
    } else {
      toast.error('Failed to restore intern')
    }
    setRestoring(null)
  }

  function daysAgo(dateStr: string) {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
    return days === 0 ? 'Today' : `${days} day${days > 1 ? 's' : ''} ago`
  }

  function daysUntilPermanent(dateStr: string) {
    const days = 90 - Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
    return days
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
          <button onClick={() => router.push('/admin/dashboard')} className="text-gray-400 hover:text-white text-sm">← Dashboard</button>
          <h1 className="text-xl font-bold text-red-400">Deleted Records</h1>
        </div>
        <span className="text-sm text-gray-500">Records auto-purge after 90 days</span>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-12">
        {records.length === 0 ? (
          <div className="text-center py-24 border border-gray-800 rounded-xl">
            <div className="text-5xl mb-4">🗑️</div>
            <h3 className="text-xl font-bold mb-2">No deleted records</h3>
            <p className="text-gray-500">All intern profiles are active.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map(record => {
              const daysLeft = daysUntilPermanent(record.deleted_at)
              return (
                <div key={record.id} className={`bg-gray-900 border rounded-xl px-6 py-4 flex items-center justify-between ${
                  daysLeft < 10 ? 'border-red-800' : 'border-gray-800'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-900 flex items-center justify-center font-bold text-red-400">
                      {record.full_name[0]}
                    </div>
                    <div>
                      <p className="font-medium">{record.full_name}</p>
                      <p className="text-sm text-gray-400">{record.cohort} · Deleted {daysAgo(record.deleted_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      daysLeft < 10
                        ? 'text-red-400 border-red-800'
                        : 'text-gray-400 border-gray-700'
                    }`}>
                      {daysLeft > 0 ? `${daysLeft}d until purge` : 'Purge due'}
                    </span>
                    <button
                      onClick={() => handleRestore(record.id)}
                      disabled={restoring === record.id}
                      className="text-green-400 hover:text-green-300 text-xs border border-green-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {restoring === record.id ? 'Restoring...' : 'Restore'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
