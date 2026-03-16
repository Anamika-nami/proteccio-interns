'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'

type ProductivityData = {
  intern_id: string
  full_name: string
  cohort: string
  attendance_percentage: number
  completed_tasks: number
  task_completion_rate: number
  total_hours_logged: number
}

function AnalyticsContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [productivity, setProductivity] = useState<ProductivityData[]>([])
  const [aggregated, setAggregated] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [filterCohort, setFilterCohort] = useState('')
  const [cohorts, setCohorts] = useState<string[]>([])

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error || !data.user) {
        router.push('/admin/login')
        return
      }
      loadAnalytics()
      loadCohorts()
    })

    return () => { mounted = false }
  }, [filterCohort])

  async function loadCohorts() {
    const supabase = createClient()
    const { data } = await supabase
      .from('intern_profiles')
      .select('cohort')
      .eq('is_active', true)
      .is('deleted_at', null)
    
    const uniqueCohorts = [...new Set(data?.map(d => d.cohort) || [])]
    setCohorts(uniqueCohorts)
  }

  async function loadAnalytics() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCohort) params.append('cohort', filterCohort)
      
      const res = await fetch(`/api/analytics/productivity?${params}`)
      const data = await res.json()
      
      setProductivity(data.productivity || [])
      setAggregated(data.aggregated || {})
      setLeaderboard(data.leaderboard || [])
    } catch (error) {
      console.error('Analytics load error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-200">Productivity Analytics</h2>
          <p className="text-xs text-gray-500">{productivity.length} active interns</p>
        </div>
        <select
          value={filterCohort}
          onChange={e => setFilterCohort(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Cohorts</option>
          {cohorts.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Aggregated Metrics */}
      {aggregated && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg Attendance', value: `${aggregated.avg_attendance?.toFixed(1)}%`, color: 'text-green-400', icon: '📊' },
            { label: 'Avg Task Completion', value: `${aggregated.avg_task_completion?.toFixed(1)}%`, color: 'text-blue-400', icon: '✅' },
            { label: 'Total Tasks Done', value: aggregated.total_tasks_completed, color: 'text-purple-400', icon: '🎯' },
            { label: 'Total Hours Logged', value: aggregated.total_hours_logged?.toFixed(0), color: 'text-yellow-400', icon: '⏱️' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{stat.icon}</span>
              </div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-gray-300 text-sm">Top Performers</h3>
        </div>
        
        {leaderboard.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-400 text-sm">No data available</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {leaderboard.map(entry => (
              <div key={entry.intern_id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-800/50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  entry.rank === 1 ? 'bg-yellow-600' : entry.rank === 2 ? 'bg-gray-400 text-gray-900' : entry.rank === 3 ? 'bg-orange-600' : 'bg-gray-700'
                }`}>
                  {entry.rank}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-gray-200 font-medium">{entry.full_name}</p>
                  <p className="text-xs text-gray-500">{entry.cohort}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-400">{entry.score}</p>
                  <p className="text-xs text-gray-500">score</p>
                </div>
                
                <div className="flex gap-3 text-xs">
                  <div className="text-center">
                    <p className="text-green-400 font-semibold">{entry.metrics.attendance.toFixed(0)}%</p>
                    <p className="text-gray-500">attend</p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-400 font-semibold">{entry.metrics.task_completion.toFixed(0)}%</p>
                    <p className="text-gray-500">tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-purple-400 font-semibold">{entry.metrics.hours_logged.toFixed(0)}h</p>
                    <p className="text-gray-500">hours</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-gray-300 text-sm">Detailed Metrics</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Intern</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Cohort</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Attendance</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Tasks Done</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Completion Rate</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Hours Logged</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {productivity.map(intern => (
                <tr key={intern.intern_id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-3 text-sm text-gray-200">{intern.full_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{intern.cohort}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-sm font-semibold ${
                      intern.attendance_percentage >= 90 ? 'text-green-400' :
                      intern.attendance_percentage >= 75 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {intern.attendance_percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center text-sm text-gray-300">{intern.completed_tasks}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-sm font-semibold ${
                      intern.task_completion_rate >= 80 ? 'text-green-400' :
                      intern.task_completion_rate >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {intern.task_completion_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center text-sm text-purple-400 font-semibold">
                    {intern.total_hours_logged.toFixed(1)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <AppProvider>
      <AppShell role="admin" title="Analytics" breadcrumbs={[{ label: 'Admin' }, { label: 'Analytics' }]}>
        <AnalyticsContent />
      </AppShell>
    </AppProvider>
  )
}
