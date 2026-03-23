'use client'
import { useEffect, useState } from 'react'
import { KPICard } from './KPICard'
import { AnalyticsChart } from './AnalyticsChart'
import { AlertsPanel } from './AlertsPanel'
import { TopPerformersCard } from './TopPerformersCard'
import { FilterPanel } from './FilterPanel'
import type { AnalyticsFilters } from '@/types/analytics'
import toast from 'react-hot-toast'

interface DashboardData {
  kpis: {
    total_interns: number
    active_interns: number
    avg_completion_rate: number
    avg_attendance_rate: number
    total_tasks: number
    completed_tasks: number
    overdue_tasks: number
    high_risk_interns: number
  }
  charts: {
    completion_rate_distribution: Array<{ range: string; count: number }>
    weekly_trends: Array<{
      intern_id: string
      full_name: string
      week_start: string
      tasks_completed: number
      completion_rate: number
    }>
    top_performers: Array<{
      name: string
      completion_rate: number
      attendance_rate: number
      score: number
    }>
  }
  alerts: Array<{
    id: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    title: string
    description: string
    created_at: string
  }>
  insights: {
    top_performers: Array<any>
    needs_attention: Array<any>
  }
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AnalyticsFilters>({})
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [filters])

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters.cohort) params.append('cohort', filters.cohort)
      if (filters.status) params.append('status', filters.status)
      if (filters.dateRange?.start) params.append('start', filters.dateRange.start)
      if (filters.dateRange?.end) params.append('end', filters.dateRange.end)

      const response = await fetch(`/api/analytics/dashboard?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      toast.error('Failed to load analytics dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function refreshInsights() {
    try {
      setRefreshing(true)
      const response = await fetch('/api/analytics/insights', { method: 'POST' })
      
      if (!response.ok) {
        throw new Error('Failed to refresh insights')
      }

      toast.success('Insights refreshed successfully')
      await loadDashboardData() // Reload dashboard data
    } catch (err) {
      console.error('Error refreshing insights:', err)
      toast.error('Failed to refresh insights')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-200">Analytics Dashboard</h1>
            <p className="text-gray-400 mt-1">Performance insights and productivity metrics</p>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Failed to Load Dashboard</h3>
          <p className="text-gray-400 mb-4">{error || 'Unknown error occurred'}</p>
          <button
            onClick={loadDashboardData}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-200">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Performance insights and productivity metrics</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshInsights}
            disabled={refreshing}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {refreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                🔄 Refresh Insights
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel filters={filters} onFiltersChange={setFilters} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Interns"
          value={data.kpis.total_interns}
          format="number"
          color="blue"
          icon="👥"
        />
        <KPICard
          title="Active Interns"
          value={data.kpis.active_interns}
          format="number"
          color="green"
          icon="✅"
          subtitle={`${Math.round((data.kpis.active_interns / data.kpis.total_interns) * 100)}% of total`}
        />
        <KPICard
          title="Avg Completion Rate"
          value={data.kpis.avg_completion_rate}
          format="percentage"
          color={data.kpis.avg_completion_rate >= 80 ? "green" : data.kpis.avg_completion_rate >= 60 ? "yellow" : "red"}
          icon="📊"
        />
        <KPICard
          title="Avg Attendance"
          value={data.kpis.avg_attendance_rate}
          format="percentage"
          color={data.kpis.avg_attendance_rate >= 90 ? "green" : data.kpis.avg_attendance_rate >= 80 ? "yellow" : "red"}
          icon="📅"
        />
        <KPICard
          title="Total Tasks"
          value={data.kpis.total_tasks}
          format="number"
          color="purple"
          icon="📋"
        />
        <KPICard
          title="Completed Tasks"
          value={data.kpis.completed_tasks}
          format="number"
          color="green"
          icon="✅"
          subtitle={`${Math.round((data.kpis.completed_tasks / data.kpis.total_tasks) * 100)}% completion`}
        />
        <KPICard
          title="Overdue Tasks"
          value={data.kpis.overdue_tasks}
          format="number"
          color="red"
          icon="⚠️"
        />
        <KPICard
          title="High Risk Interns"
          value={data.kpis.high_risk_interns}
          format="number"
          color="red"
          icon="🚨"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate Distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Completion Rate Distribution</h3>
          <AnalyticsChart
            type="bar"
            data={data.charts.completion_rate_distribution.map(item => ({
              label: item.range,
              value: item.count
            }))}
            config={{
              type: 'bar',
              title: '',
              colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
            }}
          />
        </div>

        {/* Weekly Trends */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4">Weekly Completion Trends</h3>
          <AnalyticsChart
            type="line"
            data={data.charts.weekly_trends.reduce((acc, trend) => {
              const weekLabel = new Date(trend.week_start).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })
              const existing = acc.find(item => item.label === weekLabel)
              if (existing) {
                existing.value = (existing.value + trend.completion_rate) / 2
              } else {
                acc.push({
                  label: weekLabel,
                  value: trend.completion_rate
                })
              }
              return acc
            }, [] as Array<{ label: string; value: number }>)}
            config={{
              type: 'line',
              title: '',
              yAxis: { label: 'Completion Rate', format: 'percentage' }
            }}
          />
        </div>
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Panel */}
        <div className="lg:col-span-2">
          <AlertsPanel alerts={data.alerts} />
        </div>

        {/* Top Performers */}
        <div>
          <TopPerformersCard performers={data.charts.top_performers} />
        </div>
      </div>

      {/* Needs Attention */}
      {data.insights.needs_attention.length > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-300 mb-4 flex items-center gap-2">
            🚨 Interns Needing Attention
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.insights.needs_attention.slice(0, 6).map((intern: any) => (
              <div key={intern.id} className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold">
                    {intern.full_name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-red-200">{intern.full_name}</p>
                    <p className="text-xs text-red-400">{intern.cohort}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-300">Completion:</span>
                    <span className="text-red-200">{intern.completion_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-300">Attendance:</span>
                    <span className="text-red-200">{intern.attendance_rate}%</span>
                  </div>
                  {intern.overdue_tasks > 0 && (
                    <div className="flex justify-between">
                      <span className="text-red-300">Overdue:</span>
                      <span className="text-red-200">{intern.overdue_tasks} tasks</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}