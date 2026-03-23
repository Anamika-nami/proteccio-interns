'use client'
import { useState, useEffect } from 'react'
import { AnalyticsChart } from './AnalyticsChart'
import type { ComparisonResult, InternAnalyticsSummary } from '@/types/analytics'
import toast from 'react-hot-toast'

export function InternComparisonTool() {
  const [interns, setInterns] = useState<InternAnalyticsSummary[]>([])
  const [selectedInterns, setSelectedInterns] = useState<string[]>([])
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingInterns, setLoadingInterns] = useState(true)

  useEffect(() => {
    loadInterns()
  }, [])

  async function loadInterns() {
    try {
      setLoadingInterns(true)
      const response = await fetch('/api/analytics/dashboard')
      if (!response.ok) throw new Error('Failed to load interns')
      
      const data = await response.json()
      // Get intern data from the analytics summary
      const internData = data.insights?.top_performers || []
      setInterns(internData)
    } catch (error) {
      console.error('Error loading interns:', error)
      toast.error('Failed to load intern data')
    } finally {
      setLoadingInterns(false)
    }
  }

  async function performComparison() {
    if (selectedInterns.length < 2) {
      toast.error('Please select at least 2 interns to compare')
      return
    }

    if (selectedInterns.length > 10) {
      toast.error('Please select no more than 10 interns to compare')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/analytics/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intern_ids: selectedInterns,
          comparison_type: 'performance_analysis'
        })
      })

      if (!response.ok) throw new Error('Failed to perform comparison')
      
      const data = await response.json()
      setComparison(data.comparison)
      toast.success('Comparison completed successfully')
    } catch (error) {
      console.error('Error performing comparison:', error)
      toast.error('Failed to perform comparison')
    } finally {
      setLoading(false)
    }
  }

  const toggleInternSelection = (internId: string) => {
    setSelectedInterns(prev => 
      prev.includes(internId)
        ? prev.filter(id => id !== internId)
        : [...prev, internId]
    )
  }

  const clearSelection = () => {
    setSelectedInterns([])
    setComparison(null)
  }

  if (loadingInterns) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="h-6 bg-gray-800 rounded w-48 animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg h-20 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-200">Intern Comparison Tool</h2>
          <p className="text-gray-400 mt-1">Compare performance metrics across multiple interns</p>
        </div>
        <div className="flex gap-3">
          {selectedInterns.length > 0 && (
            <button
              onClick={clearSelection}
              className="text-gray-400 hover:text-gray-300 border border-gray-700 hover:border-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Clear Selection
            </button>
          )}
          <button
            onClick={performComparison}
            disabled={selectedInterns.length < 2 || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Comparing...
              </>
            ) : (
              <>
                📊 Compare Selected ({selectedInterns.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Intern Selection */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">
          Select Interns to Compare (2-10)
        </h3>
        
        {interns.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-400">No intern data available</p>
            <p className="text-sm text-gray-500 mt-1">Complete some tasks and evaluations to enable comparisons</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interns.map((intern: any) => (
              <div
                key={intern.id}
                onClick={() => toggleInternSelection(intern.id)}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-opacity-80 ${
                  selectedInterns.includes(intern.id)
                    ? 'bg-blue-900/20 border-blue-700'
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedInterns.includes(intern.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-600'
                  }`}>
                    {selectedInterns.includes(intern.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-200">{intern.full_name}</p>
                    <p className="text-sm text-gray-400">{intern.cohort}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Completion:</span>
                    <span className="text-gray-200">{intern.completion_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Attendance:</span>
                    <span className="text-gray-200">{intern.attendance_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Score:</span>
                    <span className="text-gray-200">{intern.score || 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Comparison Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl mb-2">🏆</div>
                <div className="text-sm text-gray-400">Best Performer</div>
                <div className="font-semibold text-green-400">{comparison.summary.best_performer}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">📈</div>
                <div className="text-sm text-gray-400">Most Improved</div>
                <div className="font-semibold text-blue-400">{comparison.summary.most_improved || 'N/A'}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-sm text-gray-400">Needs Attention</div>
                <div className="font-semibold text-yellow-400">{comparison.summary.needs_attention}</div>
              </div>
            </div>
          </div>

          {/* Metric Comparisons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completion Rate Comparison */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Task Completion Rate</h4>
              <AnalyticsChart
                type="bar"
                data={comparison.metrics.completion_rate.map(metric => ({
                  label: metric.intern_name,
                  value: metric.value,
                  metadata: { rank: metric.rank }
                }))}
                config={{
                  type: 'bar',
                  title: '',
                  yAxis: { label: 'Completion Rate', format: 'percentage' },
                  colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']
                }}
              />
              <div className="mt-4 space-y-2">
                {comparison.metrics.completion_rate.map((metric, index) => (
                  <div key={metric.intern_id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">#{metric.rank}</span>
                      <span className="text-gray-200">{metric.intern_name}</span>
                    </div>
                    <span className="text-gray-300">{metric.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Rate Comparison */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Attendance Rate</h4>
              <AnalyticsChart
                type="bar"
                data={comparison.metrics.attendance_rate.map(metric => ({
                  label: metric.intern_name,
                  value: metric.value,
                  metadata: { rank: metric.rank }
                }))}
                config={{
                  type: 'bar',
                  title: '',
                  yAxis: { label: 'Attendance Rate', format: 'percentage' },
                  colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']
                }}
              />
              <div className="mt-4 space-y-2">
                {comparison.metrics.attendance_rate.map((metric, index) => (
                  <div key={metric.intern_id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">#{metric.rank}</span>
                      <span className="text-gray-200">{metric.intern_name}</span>
                    </div>
                    <span className="text-gray-300">{metric.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluation Score Comparison */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Average Evaluation Score</h4>
              <AnalyticsChart
                type="bar"
                data={comparison.metrics.avg_evaluation_score.map(metric => ({
                  label: metric.intern_name,
                  value: metric.value,
                  metadata: { rank: metric.rank }
                }))}
                config={{
                  type: 'bar',
                  title: '',
                  yAxis: { label: 'Score', format: 'number' },
                  colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']
                }}
              />
              <div className="mt-4 space-y-2">
                {comparison.metrics.avg_evaluation_score.map((metric, index) => (
                  <div key={metric.intern_id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">#{metric.rank}</span>
                      <span className="text-gray-200">{metric.intern_name}</span>
                    </div>
                    <span className="text-gray-300">{metric.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Count Comparison */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Total Tasks</h4>
              <AnalyticsChart
                type="bar"
                data={comparison.metrics.total_tasks.map(metric => ({
                  label: metric.intern_name,
                  value: metric.value,
                  metadata: { rank: metric.rank }
                }))}
                config={{
                  type: 'bar',
                  title: '',
                  yAxis: { label: 'Tasks', format: 'number' },
                  colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']
                }}
              />
              <div className="mt-4 space-y-2">
                {comparison.metrics.total_tasks.map((metric, index) => (
                  <div key={metric.intern_id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">#{metric.rank}</span>
                      <span className="text-gray-200">{metric.intern_name}</span>
                    </div>
                    <span className="text-gray-300">{metric.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Trends */}
          {comparison.trends && comparison.trends.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-200 mb-4">Weekly Performance Trends</h4>
              <AnalyticsChart
                type="line"
                data={comparison.trends.reduce((acc, trend) => {
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
                height={200}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}