'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Log = {
  id: string
  user_id: string
  action: string
  entity_type: string | null
  log_category: string | null
  created_at: string
}

const CATEGORIES = ['all', 'action', 'data_view', 'data_export', 'config_change']
const categoryColors: Record<string, string> = {
  action: 'text-blue-400 border-blue-800',
  data_view: 'text-purple-400 border-purple-800',
  data_export: 'text-green-400 border-green-800',
  config_change: 'text-yellow-400 border-yellow-800',
}

export default function LogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    let mounted = true
    
    async function init() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        if (error || !data.user) {
          router.push('/admin/login')
          return
        }
        
        await fetchLogs(mounted)
      } catch (err) {
        console.error('Init error:', err)
        if (mounted) {
          router.push('/admin/login')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    init()
    return () => { mounted = false }
  }, [router])

  async function fetchLogs(mounted = true) {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('activity_logs')
        .select('id, user_id, action, entity_type, log_category, created_at')
        .order('created_at', { ascending: false })
        .limit(200)
      
      if (mounted) {
        setLogs(data || [])
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    }
  }

  const filtered = activeCategory === 'all'
    ? logs
    : logs.filter(l => (l.log_category || 'action') === activeCategory)

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
          <h1 className="text-xl font-bold text-blue-400">Access & Activity Logs</h1>
        </div>
        <span className="text-sm text-gray-500">{filtered.length} entries</span>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeCategory === cat ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
              }`}>
              {cat === 'all' ? 'All' : cat.replace('_', ' ')}
              <span className="ml-1.5 text-xs opacity-70">
                {cat === 'all' ? logs.length : logs.filter(l => (l.log_category || 'action') === cat).length}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 border border-gray-800 rounded-xl">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500">No logs in this category yet.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-3 text-sm text-gray-400">Timestamp</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Category</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={log.id} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-950'}>
                    <td className="px-6 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[log.log_category || 'action'] || 'text-gray-400 border-gray-700'}`}>
                        {(log.log_category || 'action').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{log.action}</td>
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
