'use client'
import { useState, useEffect } from 'react'
import type { AnalyticsReport } from '@/types/analytics'
import toast from 'react-hot-toast'

export function ReportsManager() {
  const [reports, setReports] = useState<AnalyticsReport[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/reports')
      if (!response.ok) throw new Error('Failed to load reports')
      
      const data = await response.json()
      setReports(data.reports || [])
    } catch (error) {
      console.error('Error loading reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  async function generateReport(reportData: any) {
    try {
      setGenerating(true)
      const response = await fetch('/api/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      })
      
      if (!response.ok) throw new Error('Failed to generate report')
      
      const data = await response.json()
      toast.success('Report generation started')
      setShowCreateForm(false)
      await loadReports()
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const filteredReports = reports.filter(report => 
    filter === 'all' || report.status === filter
  )

  const statusConfig = {
    completed: {
      icon: '✅',
      color: 'text-green-400',
      bg: 'bg-green-900/20',
      border: 'border-green-800'
    },
    pending: {
      icon: '⏳',
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-800'
    },
    generating: {
      icon: '🔄',
      color: 'text-blue-400',
      bg: 'bg-blue-900/20',
      border: 'border-blue-800'
    },
    failed: {
      icon: '❌',
      color: 'text-red-400',
      bg: 'bg-red-900/20',
      border: 'border-red-800'
    }
  }

  const reportTypeLabels = {
    weekly_activity: 'Weekly Activity Report',
    monthly_productivity: 'Monthly Productivity Report',
    task_completion: 'Task Completion Report',
    attendance_summary: 'Attendance Summary Report'
  }

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="h-6 bg-gray-800 rounded w-48 animate-pulse mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg h-16 animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-200">Analytics Reports</h2>
          <p className="text-gray-400 mt-1">Generate and manage analytics reports</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          📊 Generate Report
        </button>
      </div>

      {/* Create Report Form */}
      {showCreateForm && (
        <CreateReportForm
          onSubmit={generateReport}
          onCancel={() => setShowCreateForm(false)}
          loading={generating}
        />
      )}

      {/* Reports List */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Generated Reports</h3>
          <button
            onClick={loadReports}
            className="text-gray-400 hover:text-gray-300 border border-gray-700 hover:border-gray-600 px-3 py-2 rounded-lg text-sm transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-4 bg-gray-800 rounded-lg p-1">
          {(['all', 'completed', 'pending', 'failed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                filter === status
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {status !== 'all' && statusConfig[status as keyof typeof statusConfig]?.icon}
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === status ? 'bg-gray-600' : 'bg-gray-700'
              }`}>
                {status === 'all' ? reports.length : reports.filter(r => r.status === status).length}
              </span>
            </button>
          ))}
        </div>

        {/* Reports */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-400">No {filter !== 'all' ? filter : ''} reports found</p>
              <p className="text-sm text-gray-500 mt-1">Generate your first analytics report</p>
            </div>
          ) : (
            filteredReports.map(report => {
              const config = statusConfig[report.status as keyof typeof statusConfig]
              
              return (
                <div
                  key={report.id}
                  className={`${config?.bg || 'bg-gray-800/50'} border ${config?.border || 'border-gray-700'} rounded-lg p-4 hover:border-opacity-80 transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-lg">{config?.icon || '📄'}</span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-200">
                            {report.title}
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${config?.border || 'border-gray-700'} ${config?.color || 'text-gray-400'}`}>
                            {report.status}
                          </span>
                          {report.is_scheduled && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-300 border border-purple-800">
                              Scheduled
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-2">
                          {reportTypeLabels[report.report_type as keyof typeof reportTypeLabels] || report.report_type}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span>
                            Created: {new Date(report.created_at).toLocaleDateString()}
                          </span>
                          {report.completed_at && (
                            <span>
                              Completed: {new Date(report.completed_at).toLocaleDateString()}
                            </span>
                          )}
                          {report.file_size_bytes && (
                            <span>
                              Size: {(report.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                            </span>
                          )}
                        </div>
                        
                        {/* Parameters */}
                        {report.parameters && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {report.parameters.date_range && (
                                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                                  {report.parameters.date_range.start} to {report.parameters.date_range.end}
                                </span>
                              )}
                              {report.parameters.format && (
                                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                                  {report.parameters.format.toUpperCase()}
                                </span>
                              )}
                              {report.parameters.cohort && (
                                <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full">
                                  Cohort: {report.parameters.cohort}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {report.status === 'completed' && report.file_url && (
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 hover:border-blue-600 px-2 py-1 rounded transition-colors"
                        >
                          Download
                        </a>
                      )}
                      {report.status === 'failed' && (
                        <button
                          onClick={() => {/* Retry logic */}}
                          className="text-xs text-yellow-400 hover:text-yellow-300 border border-yellow-800 hover:border-yellow-600 px-2 py-1 rounded transition-colors"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

function CreateReportForm({ 
  onSubmit, 
  onCancel, 
  loading 
}: { 
  onSubmit: (data: any) => void
  onCancel: () => void
  loading: boolean 
}) {
  const [formData, setFormData] = useState({
    report_type: 'weekly_activity',
    title: '',
    date_range: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    format: 'pdf',
    include_charts: true,
    cohort: '',
    is_scheduled: false,
    schedule_cron: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Please enter a report title')
      return
    }
    
    onSubmit({
      ...formData,
      parameters: {
        date_range: formData.date_range,
        format: formData.format,
        include_charts: formData.include_charts,
        ...(formData.cohort && { cohort: formData.cohort })
      }
    })
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Generate New Report</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Report Type
            </label>
            <select
              value={formData.report_type}
              onChange={(e) => setFormData(prev => ({ ...prev, report_type: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly_activity">Weekly Activity Report</option>
              <option value="monthly_productivity">Monthly Productivity Report</option>
              <option value="task_completion">Task Completion Report</option>
              <option value="attendance_summary">Attendance Summary Report</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Format
            </label>
            <select
              value={formData.format}
              onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Report Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter report title..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.date_range.start}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                date_range: { ...prev.date_range, start: e.target.value }
              }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={formData.date_range.end}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                date_range: { ...prev.date_range, end: e.target.value }
              }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cohort Filter (Optional)
          </label>
          <input
            type="text"
            value={formData.cohort}
            onChange={(e) => setFormData(prev => ({ ...prev, cohort: e.target.value }))}
            placeholder="Leave empty for all cohorts"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.include_charts}
              onChange={(e) => setFormData(prev => ({ ...prev, include_charts: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-gray-300">Include Charts</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_scheduled}
              onChange={(e) => setFormData(prev => ({ ...prev, is_scheduled: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-gray-300">Schedule Report</span>
          </label>
        </div>
        
        {formData.is_scheduled && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Schedule (Cron Expression)
            </label>
            <input
              type="text"
              value={formData.schedule_cron}
              onChange={(e) => setFormData(prev => ({ ...prev, schedule_cron: e.target.value }))}
              placeholder="0 9 * * 1 (Every Monday at 9 AM)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-300 border border-gray-700 hover:border-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Report'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}