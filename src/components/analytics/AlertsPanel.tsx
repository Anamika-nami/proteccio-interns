'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface Alert {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description?: string
  created_at: string
  intern?: {
    id: string
    full_name: string
    cohort: string
  }
}

interface AlertsPanelProps {
  alerts: Alert[]
  onAlertAction?: (alertId: string, action: 'acknowledge' | 'dismiss') => void
}

export function AlertsPanel({ alerts, onAlertAction }: AlertsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [loading, setLoading] = useState<string | null>(null)

  const filteredAlerts = alerts.filter(alert => 
    filter === 'all' || alert.severity === filter
  )

  const severityConfig = {
    critical: {
      icon: '🚨',
      color: 'text-red-400',
      bg: 'bg-red-900/20',
      border: 'border-red-800'
    },
    high: {
      icon: '⚠️',
      color: 'text-orange-400',
      bg: 'bg-orange-900/20',
      border: 'border-orange-800'
    },
    medium: {
      icon: '⚡',
      color: 'text-yellow-400',
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-800'
    },
    low: {
      icon: 'ℹ️',
      color: 'text-blue-400',
      bg: 'bg-blue-900/20',
      border: 'border-blue-800'
    }
  }

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'dismiss') => {
    if (!onAlertAction) return
    
    try {
      setLoading(alertId)
      await onAlertAction(alertId, action)
      toast.success(`Alert ${action}d successfully`)
    } catch (error) {
      toast.error(`Failed to ${action} alert`)
    } finally {
      setLoading(null)
    }
  }

  const alertCounts = {
    all: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Active Alerts</h3>
        <div className="text-sm text-gray-400">
          {filteredAlerts.length} of {alerts.length} alerts
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-800 rounded-lg p-1">
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map(severity => (
          <button
            key={severity}
            onClick={() => setFilter(severity)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
              filter === severity
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {severity !== 'all' && severityConfig[severity].icon}
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
            {alertCounts[severity] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === severity ? 'bg-gray-600' : 'bg-gray-700'
              }`}>
                {alertCounts[severity]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-gray-400">No {filter !== 'all' ? filter : ''} alerts</p>
            <p className="text-sm text-gray-500 mt-1">Everything looks good!</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const config = severityConfig[alert.severity]
            
            return (
              <div
                key={alert.id}
                className={`${config.bg} border ${config.border} rounded-lg p-4 hover:border-opacity-80 transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-lg">{config.icon}</span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${config.color}`}>
                          {alert.title}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${config.border} ${config.color}`}>
                          {alert.severity}
                        </span>
                      </div>
                      
                      {alert.description && (
                        <p className="text-sm text-gray-300 mb-2">
                          {alert.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {new Date(alert.created_at).toLocaleString()}
                        </span>
                        {alert.intern && (
                          <span>
                            {alert.intern.full_name} ({alert.intern.cohort})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {onAlertAction && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                        disabled={loading === alert.id}
                        className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 hover:border-blue-600 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        {loading === alert.id ? '...' : 'Acknowledge'}
                      </button>
                      <button
                        onClick={() => handleAlertAction(alert.id, 'dismiss')}
                        disabled={loading === alert.id}
                        className="text-xs text-gray-400 hover:text-gray-300 border border-gray-700 hover:border-gray-600 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        {loading === alert.id ? '...' : 'Dismiss'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Summary */}
      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {alertCounts.critical > 0 && (
                <span className="text-red-400">
                  {alertCounts.critical} Critical
                </span>
              )}
              {alertCounts.high > 0 && (
                <span className="text-orange-400">
                  {alertCounts.high} High
                </span>
              )}
              {alertCounts.medium > 0 && (
                <span className="text-yellow-400">
                  {alertCounts.medium} Medium
                </span>
              )}
              {alertCounts.low > 0 && (
                <span className="text-blue-400">
                  {alertCounts.low} Low
                </span>
              )}
            </div>
            
            <button className="text-gray-400 hover:text-gray-300 text-xs">
              View All Alerts →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}