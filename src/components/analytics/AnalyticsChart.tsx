'use client'
import { useMemo } from 'react'
import type { ChartDataPoint, ChartConfig } from '@/types/analytics'

interface AnalyticsChartProps {
  type: 'line' | 'bar' | 'pie' | 'donut' | 'area'
  data: ChartDataPoint[]
  config?: Partial<ChartConfig>
  height?: number
  loading?: boolean
}

export function AnalyticsChart({
  type,
  data,
  config = {},
  height = 300,
  loading = false
}: AnalyticsChartProps) {
  const chartConfig: ChartConfig = {
    type,
    title: '',
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'],
    height,
    responsive: true,
    ...config
  }

  const maxValue = useMemo(() => {
    return Math.max(...data.map(d => d.value))
  }, [data])

  const minValue = useMemo(() => {
    return Math.min(...data.map(d => d.value))
  }, [data])

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-800/50 rounded-lg animate-pulse"
        style={{ height: `${height}px` }}
      >
        <div className="text-gray-500">Loading chart...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-800/50 rounded-lg"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <div className="text-gray-500 text-4xl mb-2">📊</div>
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    )
  }

  switch (type) {
    case 'bar':
      return <BarChart data={data} config={chartConfig} maxValue={maxValue} />
    case 'line':
      return <LineChart data={data} config={chartConfig} maxValue={maxValue} minValue={minValue} />
    case 'pie':
    case 'donut':
      return <PieChart data={data} config={chartConfig} isDonut={type === 'donut'} />
    case 'area':
      return <AreaChart data={data} config={chartConfig} maxValue={maxValue} minValue={minValue} />
    default:
      return <BarChart data={data} config={chartConfig} maxValue={maxValue} />
  }
}

function BarChart({ 
  data, 
  config, 
  maxValue 
}: { 
  data: ChartDataPoint[]
  config: ChartConfig
  maxValue: number 
}) {
  return (
    <div className="space-y-4" style={{ height: `${config.height}px` }}>
      {config.title && (
        <h4 className="text-sm font-medium text-gray-300">{config.title}</h4>
      )}
      
      <div className="flex items-end justify-between h-full space-x-2">
        {data.map((item, index) => {
          const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0
          const color = item.color || config.colors![index % config.colors!.length]
          
          return (
            <div key={item.label} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center mb-2">
                <div 
                  className="w-full rounded-t transition-all duration-300 hover:opacity-80 relative group"
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: color,
                    minHeight: item.value > 0 ? '4px' : '0px'
                  }}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {item.value}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 text-center truncate w-full">
                {item.label}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Y-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>0</span>
        <span>{maxValue}</span>
      </div>
    </div>
  )
}

function LineChart({ 
  data, 
  config, 
  maxValue, 
  minValue 
}: { 
  data: ChartDataPoint[]
  config: ChartConfig
  maxValue: number
  minValue: number
}) {
  const range = maxValue - minValue
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = range > 0 ? ((maxValue - item.value) / range) * 80 + 10 : 50
    return { x, y, value: item.value, label: item.label }
  })

  const pathD = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L'
    return `${path} ${command} ${point.x} ${point.y}`
  }, '')

  return (
    <div className="space-y-4" style={{ height: `${config.height}px` }}>
      {config.title && (
        <h4 className="text-sm font-medium text-gray-300">{config.title}</h4>
      )}
      
      <div className="relative h-full">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#374151"
              strokeWidth="0.2"
              opacity="0.5"
            />
          ))}
          
          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={config.colors![0]}
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Points */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="2"
                fill={config.colors![0]}
                className="hover:r-3 transition-all cursor-pointer"
              />
              {/* Tooltip area */}
              <circle
                cx={point.x}
                cy={point.y}
                r="8"
                fill="transparent"
                className="cursor-pointer"
              >
                <title>{`${point.label}: ${point.value}`}</title>
              </circle>
            </g>
          ))}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          {data.map((item, index) => (
            <span key={index} className="truncate">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function PieChart({ 
  data, 
  config, 
  isDonut = false 
}: { 
  data: ChartDataPoint[]
  config: ChartConfig
  isDonut?: boolean
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cumulativePercentage = 0

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100
    const startAngle = (cumulativePercentage / 100) * 360
    const endAngle = ((cumulativePercentage + percentage) / 100) * 360
    
    cumulativePercentage += percentage
    
    const largeArcFlag = percentage > 50 ? 1 : 0
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180
    
    const outerRadius = 40
    const innerRadius = isDonut ? 20 : 0
    
    const x1 = 50 + outerRadius * Math.cos(startAngleRad)
    const y1 = 50 + outerRadius * Math.sin(startAngleRad)
    const x2 = 50 + outerRadius * Math.cos(endAngleRad)
    const y2 = 50 + outerRadius * Math.sin(endAngleRad)
    
    const pathData = [
      `M 50 50`,
      `L ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')
    
    return {
      pathData,
      color: item.color || config.colors![index % config.colors!.length],
      percentage: percentage.toFixed(1),
      label: item.label,
      value: item.value
    }
  })

  return (
    <div className="space-y-4" style={{ height: `${config.height}px` }}>
      {config.title && (
        <h4 className="text-sm font-medium text-gray-300">{config.title}</h4>
      )}
      
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-8">
          {/* Chart */}
          <div className="relative">
            <svg viewBox="0 0 100 100" className="w-48 h-48">
              {slices.map((slice, index) => (
                <path
                  key={index}
                  d={slice.pathData}
                  fill={slice.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <title>{`${slice.label}: ${slice.value} (${slice.percentage}%)`}</title>
                </path>
              ))}
              
              {isDonut && (
                <circle
                  cx="50"
                  cy="50"
                  r="20"
                  fill="#111827"
                />
              )}
            </svg>
            
            {isDonut && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-200">{total}</div>
                  <div className="text-xs text-gray-400">Total</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="space-y-2">
            {slices.map((slice, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-sm text-gray-300">{slice.label}</span>
                <span className="text-sm text-gray-500">({slice.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AreaChart({ 
  data, 
  config, 
  maxValue, 
  minValue 
}: { 
  data: ChartDataPoint[]
  config: ChartConfig
  maxValue: number
  minValue: number
}) {
  const range = maxValue - minValue
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = range > 0 ? ((maxValue - item.value) / range) * 80 + 10 : 50
    return { x, y, value: item.value, label: item.label }
  })

  const pathD = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L'
    return `${path} ${command} ${point.x} ${point.y}`
  }, '')

  const areaD = `${pathD} L 100 90 L 0 90 Z`

  return (
    <div className="space-y-4" style={{ height: `${config.height}px` }}>
      {config.title && (
        <h4 className="text-sm font-medium text-gray-300">{config.title}</h4>
      )}
      
      <div className="relative h-full">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#374151"
              strokeWidth="0.2"
              opacity="0.5"
            />
          ))}
          
          {/* Area */}
          <path
            d={areaD}
            fill={config.colors![0]}
            fillOpacity="0.2"
          />
          
          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={config.colors![0]}
            strokeWidth="2"
          />
          
          {/* Points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="2"
              fill={config.colors![0]}
              className="hover:r-3 transition-all cursor-pointer"
            >
              <title>{`${point.label}: ${point.value}`}</title>
            </circle>
          ))}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          {data.map((item, index) => (
            <span key={index} className="truncate">
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}