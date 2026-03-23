'use client'
import { useMemo } from 'react'

interface KPICardProps {
  title: string
  value: number | string
  format?: 'number' | 'percentage' | 'currency' | 'duration'
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  icon?: string
  subtitle?: string
  change?: number
  trend?: 'up' | 'down' | 'stable'
  loading?: boolean
}

export function KPICard({
  title,
  value,
  format = 'number',
  color = 'blue',
  icon,
  subtitle,
  change,
  trend,
  loading = false
}: KPICardProps) {
  const formattedValue = useMemo(() => {
    if (loading) return '...'
    
    switch (format) {
      case 'percentage':
        return `${typeof value === 'number' ? value.toFixed(1) : value}%`
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(typeof value === 'number' ? value : 0)
      case 'duration':
        if (typeof value === 'number') {
          const hours = Math.floor(value)
          const minutes = Math.round((value - hours) * 60)
          return `${hours}h ${minutes}m`
        }
        return value
      case 'number':
      default:
        return typeof value === 'number' 
          ? new Intl.NumberFormat('en-US').format(value)
          : value
    }
  }, [value, format, loading])

  const colorClasses = {
    blue: {
      bg: 'bg-blue-900/20',
      border: 'border-blue-800',
      text: 'text-blue-400',
      icon: 'text-blue-300'
    },
    green: {
      bg: 'bg-green-900/20',
      border: 'border-green-800',
      text: 'text-green-400',
      icon: 'text-green-300'
    },
    yellow: {
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-800',
      text: 'text-yellow-400',
      icon: 'text-yellow-300'
    },
    red: {
      bg: 'bg-red-900/20',
      border: 'border-red-800',
      text: 'text-red-400',
      icon: 'text-red-300'
    },
    purple: {
      bg: 'bg-purple-900/20',
      border: 'border-purple-800',
      text: 'text-purple-400',
      icon: 'text-purple-300'
    },
    gray: {
      bg: 'bg-gray-900',
      border: 'border-gray-800',
      text: 'text-gray-400',
      icon: 'text-gray-300'
    }
  }

  const trendIcon = {
    up: '📈',
    down: '📉',
    stable: '➡️'
  }

  const trendColor = {
    up: 'text-green-400',
    down: 'text-red-400',
    stable: 'text-gray-400'
  }

  const classes = colorClasses[color]

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="w-6 h-6 bg-gray-800 rounded"></div>
          <div className="w-4 h-4 bg-gray-800 rounded"></div>
        </div>
        <div className="w-16 h-8 bg-gray-800 rounded mb-2"></div>
        <div className="w-24 h-4 bg-gray-800 rounded"></div>
      </div>
    )
  }

  return (
    <div className={`${classes.bg} border ${classes.border} rounded-xl p-5 hover:border-opacity-80 transition-colors`}>
      <div className="flex items-center justify-between mb-3">
        {icon && (
          <span className={`text-xl ${classes.icon}`}>
            {icon}
          </span>
        )}
        {trend && (
          <span className={`text-sm ${trendColor[trend]}`}>
            {trendIcon[trend]}
          </span>
        )}
      </div>
      
      <div className={`text-3xl font-bold ${classes.text} mb-1`}>
        {formattedValue}
      </div>
      
      <div className="space-y-1">
        <p className="text-sm text-gray-400">{title}</p>
        
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
        
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs">
            <span className={change >= 0 ? 'text-green-400' : 'text-red-400'}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span className="text-gray-500">vs last period</span>
          </div>
        )}
      </div>
    </div>
  )
}