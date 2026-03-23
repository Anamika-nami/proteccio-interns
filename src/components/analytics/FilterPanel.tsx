'use client'
import { useState, useEffect } from 'react'
import type { AnalyticsFilters } from '@/types/analytics'

interface FilterPanelProps {
  filters: AnalyticsFilters
  onFiltersChange: (filters: AnalyticsFilters) => void
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const [cohorts, setCohorts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadCohorts()
  }, [])

  async function loadCohorts() {
    try {
      setLoading(true)
      const response = await fetch('/api/interns?limit=1000')
      if (response.ok) {
        const data = await response.json()
        const cohortValues = data.data?.map((intern: any) => intern.cohort).filter((c: any): c is string => typeof c === 'string') || []
        const uniqueCohorts = [...new Set(cohortValues)] as string[]
        setCohorts(uniqueCohorts.sort())
      }
    } catch (error) {
      console.error('Error loading cohorts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof AnalyticsFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = {
      start: filters.dateRange?.start || '',
      end: filters.dateRange?.end || '',
      [field]: value
    }
    
    // Only include dateRange if both fields have values
    if (newDateRange.start && newDateRange.end) {
      onFiltersChange({
        ...filters,
        dateRange: newDateRange
      })
    } else {
      const { dateRange, ...rest } = filters
      onFiltersChange(rest)
    }
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof AnalyticsFilters]
    return value !== undefined && value !== null && value !== ''
  })

  const getPresetDateRange = (preset: string) => {
    const now = new Date()
    const start = new Date()
    
    switch (preset) {
      case 'last_7_days':
        start.setDate(now.getDate() - 7)
        break
      case 'last_30_days':
        start.setDate(now.getDate() - 30)
        break
      case 'last_3_months':
        start.setMonth(now.getMonth() - 3)
        break
      case 'last_6_months':
        start.setMonth(now.getMonth() - 6)
        break
      case 'this_year':
        start.setMonth(0, 1)
        break
      default:
        return null
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    }
  }

  const applyPresetDateRange = (preset: string) => {
    const dateRange = getPresetDateRange(preset)
    if (dateRange) {
      handleFilterChange('dateRange', dateRange)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-200">Filters</h3>
          {hasActiveFilters && (
            <span className="bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-gray-300 border border-gray-700 hover:border-gray-600 px-2 py-1 rounded transition-colors"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-400 hover:text-gray-300 border border-gray-700 hover:border-gray-600 px-2 py-1 rounded transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Quick Filters (Always Visible) */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filters.cohort || ''}
          onChange={(e) => handleFilterChange('cohort', e.target.value || undefined)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="">All Cohorts</option>
          {cohorts.map(cohort => (
            <option key={cohort} value={cohort}>{cohort}</option>
          ))}
        </select>

        <select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETION_REVIEW">Completion Review</option>
          <option value="COMPLETED">Completed</option>
          <option value="EXTENDED">Extended</option>
          <option value="TERMINATED">Terminated</option>
        </select>

        {/* Date Range Presets */}
        <div className="flex gap-2">
          {[
            { label: '7D', value: 'last_7_days' },
            { label: '30D', value: 'last_30_days' },
            { label: '3M', value: 'last_3_months' },
            { label: 'YTD', value: 'this_year' }
          ].map(preset => (
            <button
              key={preset.value}
              onClick={() => applyPresetDateRange(preset.value)}
              className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                filters.dateRange && getPresetDateRange(preset.value) &&
                filters.dateRange.start === getPresetDateRange(preset.value)!.start &&
                filters.dateRange.end === getPresetDateRange(preset.value)!.end
                  ? 'bg-blue-900/30 border-blue-700 text-blue-300'
                  : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-800">
          {/* Custom Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Date Range
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Metric Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Focus Metric
            </label>
            <select
              value={filters.metric_type || ''}
              onChange={(e) => handleFilterChange('metric_type', e.target.value || undefined)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Metrics</option>
              <option value="completion_rate">Task Completion</option>
              <option value="attendance_rate">Attendance</option>
              <option value="evaluation_score">Performance Score</option>
              <option value="productivity_score">Overall Productivity</option>
            </select>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="bg-gray-800/50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {filters.cohort && (
                  <span className="bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    Cohort: {filters.cohort}
                    <button
                      onClick={() => handleFilterChange('cohort', undefined)}
                      className="hover:text-blue-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="bg-green-900/30 text-green-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    Status: {filters.status}
                    <button
                      onClick={() => handleFilterChange('status', undefined)}
                      className="hover:text-green-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.dateRange && (
                  <span className="bg-purple-900/30 text-purple-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    Date: {filters.dateRange.start} to {filters.dateRange.end}
                    <button
                      onClick={() => handleFilterChange('dateRange', undefined)}
                      className="hover:text-purple-200"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.metric_type && (
                  <span className="bg-yellow-900/30 text-yellow-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    Metric: {filters.metric_type}
                    <button
                      onClick={() => handleFilterChange('metric_type', undefined)}
                      className="hover:text-yellow-200"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}