'use client'
import { useMemo } from 'react'
import type { LearningLog } from '@/types'

interface SkillProgressChartProps {
  logs: LearningLog[]
}

export function SkillProgressChart({ logs }: SkillProgressChartProps) {
  const chartData = useMemo(() => {
    // Group logs by category and calculate total hours
    const categoryHours: Record<string, number> = {}
    const categoryCount: Record<string, number> = {}
    
    logs.forEach(log => {
      if (log.verification_status === 'verified') {
        categoryHours[log.category] = (categoryHours[log.category] || 0) + log.time_spent_hours
        categoryCount[log.category] = (categoryCount[log.category] || 0) + 1
      }
    })

    // Convert to array and sort by hours
    const categories = Object.entries(categoryHours)
      .map(([category, hours]) => ({
        category,
        hours,
        count: categoryCount[category]
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8) // Top 8 categories

    const maxHours = Math.max(...categories.map(c => c.hours), 1)

    return { categories, maxHours }
  }, [logs])

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-blue-600',
      'bg-green-600',
      'bg-purple-600',
      'bg-yellow-600',
      'bg-red-600',
      'bg-indigo-600',
      'bg-pink-600',
      'bg-teal-600'
    ]
    return colors[index % colors.length]
  }

  const getTextColor = (index: number) => {
    const colors = [
      'text-blue-400',
      'text-green-400',
      'text-purple-400',
      'text-yellow-400',
      'text-red-400',
      'text-indigo-400',
      'text-pink-400',
      'text-teal-400'
    ]
    return colors[index % colors.length]
  }

  if (chartData.categories.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Skill Progress</h2>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H9a2 2 0 00-2 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-300 mb-2">No verified learning yet</h3>
          <p className="text-gray-400">
            Your skill progress will appear here once you log and verify learning activities
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Skill Progress</h2>
        <div className="text-sm text-gray-400">
          Total: {chartData.categories.reduce((sum, c) => sum + c.hours, 0).toFixed(1)} hours
        </div>
      </div>

      <div className="space-y-4">
        {chartData.categories.map((category, index) => (
          <div key={category.category} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-medium truncate">
                {category.category}
              </span>
              <div className="flex items-center gap-3 text-gray-400">
                <span>{category.count} session{category.count !== 1 ? 's' : ''}</span>
                <span className={getTextColor(index)}>
                  {category.hours.toFixed(1)}h
                </span>
              </div>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getCategoryColor(index)}`}
                style={{ 
                  width: `${(category.hours / chartData.maxHours) * 100}%`,
                  minWidth: category.hours > 0 ? '8px' : '0'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">
              {chartData.categories.length}
            </div>
            <div className="text-xs text-gray-400">Categories</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-white">
              {chartData.categories.reduce((sum, c) => sum + c.count, 0)}
            </div>
            <div className="text-xs text-gray-400">Sessions</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-white">
              {chartData.categories.reduce((sum, c) => sum + c.hours, 0).toFixed(0)}
            </div>
            <div className="text-xs text-gray-400">Hours</div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-sm font-medium text-white mb-3">Recent Learning</h3>
        <div className="space-y-2">
          {logs
            .filter(log => log.verification_status === 'verified')
            .slice(0, 3)
            .map(log => (
              <div key={log.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate">{log.topic}</span>
                <div className="flex items-center gap-2 text-gray-400">
                  <span>{log.time_spent_hours}h</span>
                  <span>•</span>
                  <span>{new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}