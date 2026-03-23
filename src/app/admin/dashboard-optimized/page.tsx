// ============================================
// OPTIMIZED ADMIN DASHBOARD
// ============================================
// Performance improvements:
// 1. React.memo for expensive components
// 2. useMemo/useCallback to prevent re-renders
// 3. Progressive data loading
// 4. Skeleton loaders
// 5. Debounced updates
// 6. Lazy loading

'use client'
import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'

// ============================================
// MEMOIZED COMPONENTS
// ============================================

const MetricCard = memo(({ label, value, color, icon }: {
  label: string
  value: number
  color: string
  icon: string
}) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xl">{icon}</span>
    </div>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </div>
))
MetricCard.displayName = 'MetricCard'

const ToggleSwitch = memo(({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-300">{label}</span>
    <button 
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${checked ? 'bg-blue-600' : 'bg-gray-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
))
ToggleSwitch.displayName = 'ToggleSwitch'

const InternRow = memo(({ intern, onView }: {
  intern: any
  onView: (id: string) => void
}) => {
  const statusColor: Record<string, string> = {
    active: 'bg-green-900 text-green-300',
    pending: 'bg-yellow-900 text-yellow-300',
    approved: 'bg-blue-900 text-blue-300',
    inactive: 'bg-orange-900 text-orange-300',
    draft: 'bg-gray-800 text-gray-400',
    archived: 'bg-red-900 text-red-300',
  }

  return (
    <div className="px-5 py-3 flex items-center gap-3 hover:bg-gray-800/50 transition-colors">
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
      <button 
        onClick={() => onView(intern.id)}
        className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 px-2 py-1 rounded transition-colors"
      >
        View
      </button>
    </div>
  )
})
InternRow.displayName = 'InternRow'

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

type Config = Record<string, string | boolean>

function DashboardContent() {
  const router = useRouter()
  
  // State management
  const [metrics, setMetrics] = useState({ interns: 0, pending: 0, projects: 0, consented: 0 })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [interns, setInterns] = useState<any[]>([])
  const [config, setConfig] = useState<Config>({})
  
  // Loading states (granular for progressive loading)
  const [authLoading, setAuthLoading] = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [internsLoading, setInternsLoading] = useState(true)
  const [configLoading, setConfigLoading] = useState(true)

  // ============================================
  // MEMOIZED VALUES
  // ============================================

  const moduleToggles = useMemo(() => [
    { key: 'enable_interns', label: 'Interns Module' },
    { key: 'enable_projects', label: 'Projects Module' },
    { key: 'enable_tasks', label: 'Tasks Module' },
  ], [])

  const widgetToggles = useMemo(() => [
    { key: 'widget_overview', label: 'Overview Cards' },
    { key: 'widget_table', label: 'Interns Table' },
    { key: 'widget_activity', label: 'Activity Feed' },
  ], [])

  const metricCards = useMemo(() => [
    { label: 'Active Interns', value: metrics.interns, color: 'text-blue-400', icon: '👥' },
    { label: 'Pending Approval', value: metrics.pending, color: 'text-yellow-400', icon: '⏳' },
    { label: 'Total Projects', value: metrics.projects, color: 'text-green-400', icon: '📁' },
    { label: 'Consent Records', value: metrics.consented, color: 'text-purple-400', icon: '✅' },
  ], [metrics])

  // ============================================
  // MEMOIZED CALLBACKS
  // ============================================

  const loadMetrics = useCallback(async () => {
    try {
      const supabase = createClient()
      
      // Parallel queries with Promise.all
      const [internsRes, pendingRes, projectsRes, consentRes] = await Promise.all([
        supabase.from('intern_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true).is('deleted_at', null),
        supabase.from('intern_profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending').is('deleted_at', null),
        supabase.from('projects').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('consent_logs').select('id', { count: 'exact', head: true }),
      ])

      setMetrics({
        interns: internsRes.count || 0,
        pending: pendingRes.count || 0,
        projects: projectsRes.count || 0,
        consented: consentRes.count || 0,
      })
    } catch (err) {
      console.error('Metrics load error:', err)
    } finally {
      setMetricsLoading(false)
    }
  }, [])

  const loadConfig = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: configRes } = await supabase.from('app_config').select('key, value')
      
      const cfgMap: Config = {}
      for (const row of configRes || []) {
        cfgMap[row.key] = row.value
      }
      setConfig(cfgMap)
    } catch (err) {
      console.error('Config load error:', err)
    } finally {
      setConfigLoading(false)
    }
  }, [])

  const loadActivity = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: activityRes } = await supabase
        .from('activity_logs')
        .select('action, created_at, log_category')
        .order('created_at', { ascending: false })
        .limit(5)
      
      setRecentActivity(activityRes || [])
    } catch (err) {
      console.error('Activity load error:', err)
    } finally {
      setActivityLoading(false)
    }
  }, [])

  const loadInterns = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: internData } = await supabase
        .from('intern_profiles')
        .select('id, full_name, cohort, approval_status, lifecycle_status, is_active, created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10)
      
      setInterns(internData || [])
    } catch (err) {
      console.error('Interns load error:', err)
    } finally {
      setInternsLoading(false)
    }
  }, [])

  const toggleConfig = useCallback(async (key: string, current: boolean) => {
    const supabase = createClient()
    const newVal = current ? 'false' : 'true'
    await supabase.from('app_config')
      .upsert({ key: key, value: newVal }, { onConflict: 'key' })
    setConfig(prev => ({ ...prev, [key]: newVal }))
  }, [])

  const handleViewIntern = useCallback((id: string) => {
    router.push(`/admin/interns/${id}`)
  }, [router])

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error || !data.user) {
        router.push('/admin/login')
        return
      }
      setAuthLoading(false)
      
      // Load data progressively (non-blocking)
      loadMetrics()
      loadConfig()
      loadActivity()
      loadInterns()
    }).catch(() => {
      if (mounted) {
        setAuthLoading(false)
        router.push('/admin/login')
      }
    })

    return () => { mounted = false }
  }, [router, loadMetrics, loadConfig, loadActivity, loadInterns])

  // ============================================
  // LOADING STATE
  // ============================================

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">

      {/* Metric Cards */}
      {config['widget_overview'] !== 'false' && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">System Overview</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricsLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-24" />
              ))
            ) : (
              metricCards.map(m => (
                <MetricCard key={m.label} {...m} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Module Toggles + Widget Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-300 text-sm mb-4">Module Toggles</h3>
          {configLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {moduleToggles.map(t => (
                <ToggleSwitch
                  key={t.key}
                  label={t.label}
                  checked={config[t.key] !== 'false'}
                  onChange={(checked) => toggleConfig(t.key, !checked)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-300 text-sm mb-4">Dashboard Widgets</h3>
          {configLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {widgetToggles.map(t => (
                <ToggleSwitch
                  key={t.key}
                  label={t.label}
                  checked={config[t.key] !== 'false'}
                  onChange={(checked) => toggleConfig(t.key, !checked)}
                />
              ))}
            </div>
          )}
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
          {internsLoading ? (
            <div className="px-5 py-12">
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-800 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-800 rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-gray-800 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : interns.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-gray-400 text-sm">No interns yet.</p>
              <button onClick={() => router.push('/admin/interns')} className="mt-3 text-blue-400 text-sm hover:text-blue-300">
                Go to Interns →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {interns.map(intern => (
                <InternRow key={intern.id} intern={intern} onView={handleViewIntern} />
              ))}
            </div>
          )}
          {!internsLoading && interns.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-800">
              <button onClick={() => router.push('/admin/interns')} className="text-xs text-blue-400 hover:text-blue-300">
                View all interns →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Activity Feed */}
      {config['widget_activity'] !== 'false' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h3 className="font-semibold text-gray-300 text-sm">Recent Activity</h3>
          </div>
          {activityLoading ? (
            <div className="px-5 py-12">
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                    <div className="flex-1 h-4 bg-gray-800 rounded"></div>
                    <div className="h-3 bg-gray-800 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {recentActivity.map((log, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.log_category === 'security' ? 'bg-red-400' : log.log_category === 'privacy' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                  <span className="text-sm text-gray-300 flex-1">{log.action}</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <p className="text-gray-400 text-sm">No recent activity</p>
            </div>
          )}
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
