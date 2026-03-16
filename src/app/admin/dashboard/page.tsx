'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'

type Config = Record<string, string | boolean>

function DashboardContent() {
  const router = useRouter()
  const [metrics, setMetrics] = useState({ interns: 0, pending: 0, projects: 0, consented: 0 })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [interns, setInterns] = useState<any[]>([])
  const [config, setConfig] = useState<Config>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error || !data.user) {
        router.push('/admin/login')
        return
      }
      loadAll()
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        router.push('/admin/login')
      }
    })

    return () => { mounted = false }
  }, [])

  async function loadAll() {
    try {
      const supabase = createClient()

      const [internsRes, pendingRes, projectsRes, consentRes, activityRes, configRes] = await Promise.all([
        supabase.from('intern_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
        supabase.from('intern_profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending').is('deleted_at', null),
        supabase.from('projects').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('consent_logs').select('id', { count: 'exact', head: true }),
        supabase.from('activity_logs').select('action, created_at, log_category').order('created_at', { ascending: false }).limit(5),
        supabase.from('app_config').select('key, value'),
      ])

      setMetrics({
        interns:   internsRes.count  || 0,
        pending:   pendingRes.count  || 0,
        projects:  projectsRes.count || 0,
        consented: consentRes.count  || 0,
      })
      setRecentActivity(activityRes.data || [])

      const cfgMap: Config = {}
      for (const row of configRes.data || []) {
        cfgMap[row.key] = row.value
      }
      setConfig(cfgMap)

      // Load interns list for the table section
      const { data: internData } = await supabase
        .from('intern_profiles')
        .select('id, full_name, cohort, approval_status, lifecycle_status, is_active, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10)
      setInterns(internData || [])

    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const moduleToggles = [
    { key: 'enable_interns',  label: 'Interns Module' },
    { key: 'enable_projects', label: 'Projects Module' },
    { key: 'enable_tasks',    label: 'Tasks Module' },
  ]
  const widgetToggles = [
    { key: 'widget_overview',  label: 'Overview Cards' },
    { key: 'widget_table',     label: 'Interns Table' },
    { key: 'widget_activity',  label: 'Activity Feed' },
  ]

  async function toggleConfig(key: string, current: boolean) {
    const supabase = createClient()
    const newVal = current ? 'false' : 'true'
    await supabase.from('app_config')
      .upsert({ key: key, value: newVal }, { onConflict: 'key' })
    setConfig(prev => ({ ...prev, [key]: newVal }))
  }

  const statusColor: Record<string, string> = {
    active:   'bg-green-900 text-green-300',
    pending:  'bg-yellow-900 text-yellow-300',
    approved: 'bg-blue-900 text-blue-300',
    inactive: 'bg-orange-900 text-orange-300',
    draft:    'bg-gray-800 text-gray-400',
    archived: 'bg-red-900 text-red-300',
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-48" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Metric Cards */}
      {config['widget_overview'] !== 'false' && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">System Overview</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Interns',    value: metrics.interns,   color: 'text-blue-400',   icon: '👥' },
              { label: 'Pending Approval',  value: metrics.pending,   color: 'text-yellow-400', icon: '⏳' },
              { label: 'Total Projects',    value: metrics.projects,  color: 'text-green-400',  icon: '📁' },
              { label: 'Consent Records',   value: metrics.consented, color: 'text-purple-400', icon: '✅' },
            ].map(m => (
              <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{m.icon}</span>
                </div>
                <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-xs text-gray-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Toggles + Widget Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-300 text-sm mb-4">Module Toggles</h3>
          <div className="space-y-3">
            {moduleToggles.map(t => {
              const on = config[t.key] !== 'false'
              return (
                <div key={t.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{t.label}</span>
                  <button onClick={() => toggleConfig(t.key, on)}
                    className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${on ? 'bg-blue-600' : 'bg-gray-600'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-300 text-sm mb-4">Dashboard Widgets</h3>
          <div className="space-y-3">
            {widgetToggles.map(t => {
              const on = config[t.key] !== 'false'
              return (
                <div key={t.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{t.label}</span>
                  <button onClick={() => toggleConfig(t.key, on)}
                    className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${on ? 'bg-blue-600' : 'bg-gray-600'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Interns Table */}
      {config['widget_table'] !== 'false' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-semibold text-gray-300 text-sm">Manage Interns</h3>
            <div className="flex gap-2">
              <a href="/api/export/interns" className="text-xs text-green-400 border border-green-800 hover:border-green-600 px-3 py-1.5 rounded-lg transition-colors">
                Export CSV
              </a>
              <button onClick={() => router.push('/admin/interns')}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                + Add Intern
              </button>
            </div>
          </div>
          {interns.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-gray-400 text-sm">No interns yet.</p>
              <button onClick={() => router.push('/admin/interns')} className="mt-3 text-blue-400 text-sm hover:text-blue-300">
                Go to Interns →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {interns.map(intern => (
                <div key={intern.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {intern.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium truncate">{intern.full_name}</p>
                    <p className="text-xs text-gray-500">{intern.cohort}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[intern.lifecycle_status || intern.approval_status] || 'bg-gray-800 text-gray-400'}`}>
                    {intern.lifecycle_status || intern.approval_status}
                  </span>
                  <button onClick={() => router.push(`/admin/interns/${intern.id}`)}
                    className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 px-2 py-1 rounded transition-colors">
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
          {interns.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-800">
              <button onClick={() => router.push('/admin/interns')} className="text-xs text-blue-400 hover:text-blue-300">
                View all interns →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Activity Feed */}
      {config['widget_activity'] !== 'false' && recentActivity.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h3 className="font-semibold text-gray-300 text-sm">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {recentActivity.map((log, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.log_category === 'security' ? 'bg-red-400' : log.log_category === 'privacy' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                <span className="text-sm text-gray-300 flex-1">{log.action}</span>
                <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default function DashboardPage() {
  return (
    <AppProvider>
      <AppShell role="admin" title="Dashboard" breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}>
        <DashboardContent />
      </AppShell>
    </AppProvider>
  )
}
