'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ConsentRecord = {
  id: string
  user_id: string
  consented_at: string
  version: string
}

export default function ConsentLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<ConsentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else fetchLogs()
    })
  }, [])

  async function fetchLogs() {
    const supabase = createClient()
    const { data } = await supabase
      .from('consent_logs')
      .select('*')
      .order('consented_at', { ascending: false })
    setLogs(data || [])
    setLoading(false)
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
          <h1 className="text-xl font-bold text-blue-400">Consent Logs</h1>
        </div>
        <span className="text-sm text-gray-500">{logs.length} consent records</span>
      </nav>

      <section className="max-w-4xl mx-auto px-6 py-12">
        {logs.length === 0 ? (
          <div className="text-center py-24 border border-gray-800 rounded-xl">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-bold mb-2">No consent records yet</h3>
            <p className="text-gray-500">Records will appear when users accept the privacy notice.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
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
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{log.user_id}</td>
                    <td className="px-4 py-4 text-sm text-white">
                      {new Date(log.consented_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-700">
                        {log.version}
                      </span>
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
