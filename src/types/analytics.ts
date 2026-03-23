// Analytics & Intelligence Layer Types

export interface InternAnalyticsSummary {
  id: string
  full_name: string
  cohort: string
  status: string
  joined_at: string
  
  // Task metrics
  total_tasks: number
  completed_tasks: number
  overdue_tasks: number
  completion_rate: number
  avg_completion_hours: number
  
  // Attendance metrics
  total_days: number
  present_days: number
  attendance_rate: number
  total_hours_worked: number
  
  // Performance metrics
  avg_evaluation_score: number
  evaluation_count: number
  latest_evaluation_score: number
  
  // Recent activity
  last_task_completion?: string
  last_attendance?: string
  
  // Risk indicators
  high_risk_indicators: number
  medium_risk_indicators: number
}

export interface PerformanceMetrics {
  intern_id: string
  period_type: 'daily' | 'weekly' | 'monthly'
  period_start: string
  period_end: string
  
  // Task metrics
  tasks_assigned: number
  tasks_completed: number
  tasks_overdue: number
  completion_rate: number
  avg_completion_time_hours: number
  
  // Attendance metrics
  expected_days: number
  present_days: number
  absent_days: number
  attendance_rate: number
  total_hours_worked: number
  
  // Performance metrics
  avg_evaluation_score: number
  evaluation_count: number
  
  // Productivity indicators
  productivity_score: number
  trend_direction: 'up' | 'down' | 'stable'
}

export interface ProductivityInsight {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  affected_interns: string[]
  data: Record<string, any>
}

export interface AnalyticsAlert {
  id: string
  intern_id?: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description?: string
  data: Record<string, any>
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  acknowledged_by?: string
  acknowledged_at?: string
  resolved_at?: string
  threshold_value?: number
  actual_value?: number
  confidence_score: number
  created_at: string
  expires_at?: string
  
  // Joined data
  intern?: {
    id: string
    full_name: string
    cohort: string
  }
}

export interface PredictiveIndicator {
  intern_id: string
  indicator_type: string
  risk_level: 'low' | 'medium' | 'high'
  probability_score: number
  prediction_horizon_days: number
  factors: Record<string, any>
  confidence_interval: {
    lower: number
    upper: number
  }
  model_version?: string
}

export interface ComparisonResult {
  intern_ids: string[]
  comparison_type: string
  metrics: {
    completion_rate: ComparisonMetric[]
    attendance_rate: ComparisonMetric[]
    avg_evaluation_score: ComparisonMetric[]
    total_tasks: ComparisonMetric[]
  }
  trends: WeeklyTrend[]
  summary: {
    best_performer: string
    most_improved: string
    needs_attention: string
  }
}

export interface ComparisonMetric {
  intern_id: string
  intern_name: string
  value: number
  rank: number
}

export interface WeeklyTrend {
  intern_id: string
  full_name: string
  week_start: string
  tasks_completed: number
  tasks_assigned: number
  completion_rate: number
  avg_completion_hours: number
}

export interface AnalyticsReport {
  id: string
  report_type: string
  title: string
  parameters: Record<string, any>
  status: 'pending' | 'generating' | 'completed' | 'failed'
  file_url?: string
  file_size_bytes?: number
  is_scheduled: boolean
  schedule_cron?: string
  next_run_at?: string
  generated_by: string
  created_at: string
  completed_at?: string
}

export interface DashboardKPI {
  label: string
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'stable'
  format?: 'number' | 'percentage' | 'currency' | 'duration'
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  icon?: string
}

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
  metadata?: Record<string, any>
}

export interface TimeSeriesData {
  date: string
  value: number
  category?: string
  metadata?: Record<string, any>
}

export interface AnalyticsFilters {
  cohort?: string
  status?: string
  dateRange?: {
    start: string
    end: string
  }
  intern_ids?: string[]
  metric_type?: string
}

// API Response Types
export interface AnalyticsResponse<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: {
    total?: number
    page?: number
    limit?: number
    filters?: AnalyticsFilters
  }
}

// Chart Configuration Types
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter'
  title: string
  subtitle?: string
  xAxis?: {
    label: string
    type: 'category' | 'datetime' | 'numeric'
  }
  yAxis?: {
    label: string
    format?: 'number' | 'percentage' | 'currency'
  }
  colors?: string[]
  height?: number
  responsive?: boolean
}

// Dashboard Widget Types
export interface DashboardWidget {
  id: string
  type: 'kpi' | 'chart' | 'table' | 'alert' | 'list'
  title: string
  size: 'small' | 'medium' | 'large' | 'full'
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, any>
  data_source: string
  refresh_interval?: number
  is_visible: boolean
}

// Export Types
export interface ExportConfig {
  format: 'pdf' | 'csv' | 'xlsx' | 'json'
  template?: string
  filters?: AnalyticsFilters
  include_charts?: boolean
  include_raw_data?: boolean
}

// Notification Types for Analytics
export interface AnalyticsNotification {
  type: 'alert' | 'insight' | 'report_ready' | 'threshold_breach'
  severity: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  data?: Record<string, any>
  action_url?: string
  expires_at?: string
}