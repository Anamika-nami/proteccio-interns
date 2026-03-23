'use client'
import { useState, useEffect } from 'react'
import type { PredictiveIndicator } from '@/types/analytics'
import toast from 'react-hot-toast'

interface PredictiveIndicatorsProps {
  internId?: string
}

export function PredictiveIndicators({ internId }: PredictiveIndicatorsProps) {
  const [indicators, setIndicators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  useEffect(() => {
    loadIndicators()
  }, [internId])

  async function loadIndicators() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (internId) params.append('intern_id', internId)
      
      const response = await fetch(`/api/analytics/predictive?${params}`)
      if (!response.ok) throw new Error('Failed to load indicators')
      
      const data = await response.json()
      setIndicators(data.indicators || [])
    } catch (error) {
      console.error('Error loading indicators:', error)
      toast.error('Failed to load predictive indicators')
    } finally {
      setLoading(false)
    }
  }

  async function generateIndicators(targetInternId?: string) {
    try {
      setGenerating(true)
      
      if (targetInternId) {
        // Generate for specific intern
        const response = await fetch('/api/analytics/predictive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intern_id: targetInternId })
        })
        
        if (!response.ok) throw new Error('Failed to generate indicators')
        toast.success('Predictive indicators generated successfully')
      } else {
        // Generate for all active interns
        const response = await fetch('/api/analytics/predictive', {
          method: 'PUT'
        })
        
        if (!response.ok) throw new Error('Failed to generate batch indicators')
        const data = await response.json()
        toast.success(`Generated indicators for ${data.successful} interns`)
      }
      
      await loadIndicators()
    } catch (error) {
      console.error('Error generating indicators:', error)
      toast.error('Failed to generate predictive indicators')
    } finally {
      setGenerating(false)
    }
  }

  const filteredIndicators = indicators.filter(indicator => 
    filter === 'all' || indicator.risk_level === filter
  )

  const riskConfig = {
    high: {
      icon: '🚨',
      color: 'text-red-400',
      bg: 'bg-red-900/20',
      border: 'border-red-800'
    },
    medium: {
      icon: '⚠️',
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

  const indicatorTypeLabels = {
    deadline_miss_risk: 'Deadline Miss Risk',
    attendance_risk: 'Attendance Risk',
    productivity_decline: 'Productivity Decline',
    performance_drop: 'Performance Drop',
    engagement_decline: 'Engagement Decline'
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Predictive Risk Indicators</h3>
        <div className="flex gap-2">
          {!internId && (
            <button
              onClick={() => generateIndicators()}
              disabled={generating}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  🔮 Generate All
                </>
              )}
            </button>
          )}
          <button
            onClick={loadIndicators}
            className="text-gray-400 hover:text-gray-300 border border-gray-700 hover:border-gray-600 px-3 py-2 rounded-lg text-sm transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-800 rounded-lg p-1">
        {(['all', 'high', 'medium', 'low'] as const).map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
              filter === level
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {level !== 'all' && riskConfig[level].icon}
            {level.charAt(0).toUpperCase() + level.slice(1)}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === level ? 'bg-gray-600' : 'bg-gray-700'
            }`}>
              {level === 'all' ? indicators.length : indicators.filter(i => i.risk_level === level).length}
            </span>
          </button>
        ))}
      </div>

      {/* Indicators List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredIndicators.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-gray-400">No {filter !== 'all' ? filter + ' risk ' : ''}indicators found</p>
            <p className="text-sm text-gray-500 mt-1">
              {indicators.length === 0 
                ? 'Generate predictive indicators to see risk assessments'
                : 'All interns are performing well!'
              }
            </p>
          </div>
        ) : (
          filteredIndicators.map((indicator: any) => {
            const config = riskConfig[indicator.risk_level as keyof typeof riskConfig]
            const probabilityPercent = Math.round(indicator.probability_score * 100)
            
            return (
              <div
                key={indicator.id}
                className={`${config.bg} border ${config.border} rounded-lg p-4 hover:border-opacity-80 transition-colors`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-lg">{config.icon}</span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${config.color}`}>
                          {indicatorTypeLabels[indicator.indicator_type as keyof typeof indicatorTypeLabels] || indicator.indicator_type}
                        </h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${config.border} ${config.color}`}>
                          {indicator.risk_level}
                        </span>
                      </div>
                      
                      {indicator.intern && (
                        <p className="text-sm text-gray-300 mb-2">
                          {indicator.intern.full_name} ({indicator.intern.cohort})
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <span>
                          Probability: {probabilityPercent}%
                        </span>
                        <span>
                          Horizon: {indicator.prediction_horizon_days} days
                        </span>
                        <span>
                          Model: v{indicator.model_version || '1.0'}
                        </span>
                      </div>
                      
                      {/* Probability Bar */}
                      <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            indicator.risk_level === 'high' ? 'bg-red-500' :
                            indicator.risk_level === 'medium' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${probabilityPercent}%` }}
                        />
                      </div>
                      
                      {/* Contributing Factors */}
                      {indicator.factors && Object.keys(indicator.factors).length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-1">Contributing factors:</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(indicator.factors).map(([key, value]) => (
                              <span
                                key={key}
                                className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full"
                              >
                                {key.replace(/_/g, ' ')}: {typeof value === 'number' ? value.toFixed(1) : String(value)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {internId && (
                    <button
                      onClick={() => generateIndicators(internId)}
                      disabled={generating}
                      className="text-xs text-purple-400 hover:text-purple-300 border border-purple-800 hover:border-purple-600 px-2 py-1 rounded transition-colors disabled:opacity-50 ml-4"
                    >
                      {generating ? '...' : 'Refresh'}
                    </button>
                  )}
                </div>
                
                {/* Confidence Interval */}
                {indicator.confidence_interval && (
                  <div className="text-xs text-gray-500 mt-2">
                    Confidence: {Math.round(indicator.confidence_interval.lower * 100)}% - {Math.round(indicator.confidence_interval.upper * 100)}%
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Summary Stats */}
      {indicators.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-lg font-bold text-red-400">
                {indicators.filter(i => i.risk_level === 'high').length}
              </div>
              <div className="text-gray-500">High Risk</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">
                {indicators.filter(i => i.risk_level === 'medium').length}
              </div>
              <div className="text-gray-500">Medium Risk</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">
                {indicators.filter(i => i.risk_level === 'low').length}
              </div>
              <div className="text-gray-500">Low Risk</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}