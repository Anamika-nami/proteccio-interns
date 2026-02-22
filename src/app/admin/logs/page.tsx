'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Log = {
  id: string
  action: string
  entity_type: string
  metadata: any
  created_at: string
}

export default function LogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
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
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error) setLogs(data || [])
    setLoading(false)
  }

  function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/dashboard')} className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Dashboard
          </button>
          <h1 className="text-xl font-bold text-blue-400">Activity Logs</h1>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">System Activity</h2>
            <p className="text-gray-400 text-sm mt-1">Last 50 events</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse h-14" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            No activity logged yet.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <div key={log.id} className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 flex items-center justify-between hover:border-gray-600 transition-colors">
                <div className="flex items-center gap-4">
                  <span className={`w-2 h-2 rounded-full ${
                    log.entity_type === 'auth' ? 'bg-blue-400' :
                    log.entity_type === 'intern_profile' ? 'bg-green-400' :
                    log.entity_type === 'task' ? 'bg-yellow-400' :
                    'bg-purple-400'
                  }`} />
                  <div>
                    <p className="font-medium text-sm">{log.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {log.entity_type}
                      {log.metadata && ` · ${JSON.stringify(log.metadata).slice(0, 60)}...`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{timeAgo(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
