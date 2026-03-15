'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ConsentLog = {
  id: string
  user_id: string
  consented_at: string
  version: string
}

export default function ConsentLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<ConsentLog[]>([])
  const [loading, setLoading] = useState(true)

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
      fetchLogs()
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        router.push('/admin/login')
      }
    })

    return () => { mounted = false }
  }, [])

  async function fetchLogs() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('consent_logs')
        .select('id, user_id, consented_at, version')
        .order('consented_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching consent logs:', error)
      }
      
      setLogs(data || [])
    } catch (err) {
      console.error('Failed to fetch consent logs:', err)
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-xl font-bold text-blue-400">Consent Logs</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{logs.length} records</span>
          <a href="/api/export/consent-logs"
            className="text-sm text-green-400 hover:text-green-300 border border-green-800 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500">
            Export CSV
          </a>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-10">
        {logs.length === 0 ? (
          <div className="text-center py-20 border border-gray-800 rounded-xl">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500">No consent records yet.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-3 text-sm text-gray-400">User ID</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Consented At</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Version</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'}>
                    <td className="px-6 py-3 text-xs font-mono text-gray-300">{log.user_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{new Date(log.consented_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-900 text-blue-300 border border-blue-700 px-2 py-0.5 rounded-full">{log.version}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
