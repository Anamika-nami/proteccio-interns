import { createClient } from '@/lib/supabase/server'
import type { 
  InternAnalyticsSummary, 
  PerformanceMetrics, 
  ProductivityInsight,
  AnalyticsAlert,
  PredictiveIndicator,
  ComparisonResult
} from '@/types/analytics'
import { logActivity } from '@/lib/logger'

export class AnalyticsService {
  /**
   * Get comprehensive analytics summary for all interns
   */
  static async getInternAnalyticsSummary(filters?: {
    cohort?: string
    status?: string
    dateRange?: { start: string; end: string }
  }): Promise<{ success: boolean; data?: InternAnalyticsSummary[]; error?: string }> {
    try {
      const supabase = await createClient()
      
      let query = supabase
        .from('intern_analytics_summary')
        .select('*')
        .order('completion_rate', { ascending: false })

      // Apply filters
      if (filters?.cohort) {
        query = query.eq('cohort', filters.cohort)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.dateRange) {
        query = query
          .gte('joined_at', filters.dateRange.start)
          .lte('joined_at', filters.dateRange.end)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching analytics summary:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Calculate and store performance metrics for a specific period
   */
  static async calculatePerformanceMetrics(
    internId: string,
    periodType: 'daily' | 'weekly' | 'monthly',
    periodStart: string,
    periodEnd: string
  ): Promise<{ success: boolean; metrics?: PerformanceMetrics; error?: string }> {
    try {
      const supabase = await createClient()

      // Calculate task metrics
      const { data: taskMetrics } = await supabase
        .from('tasks')
        .select('id, status, created_at, updated_at, due_date')
        .eq('assigned_to', internId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)

      const tasksAssigned = taskMetrics?.length || 0
      const tasksCompleted = taskMetrics?.filter(t => t.status === 'done').length || 0
      const tasksOverdue = taskMetrics?.filter(t => 
        t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()
      ).length || 0
      
      const completionRate = tasksAssigned > 0 ? (tasksCompleted / tasksAssigned) * 100 : 0
      
      const completedTasks = taskMetrics?.filter(t => t.status === 'done') || []
      const avgCompletionTime = completedTasks.length > 0 
        ? completedTasks.reduce((acc, task) => {
            const hours = (new Date(task.updated_at).getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60)
            return acc + hours
          }, 0) / completedTasks.length
        : 0

      // Calculate attendance metrics
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status, working_hours')
        .eq('intern_id', internId)
        .gte('date', periodStart)
        .lte('date', periodEnd)

      const expectedDays = attendanceData?.length || 0
      const presentDays = attendanceData?.filter(a => a.status === 'present').length || 0
      const absentDays = attendanceData?.filter(a => a.status === 'absent').length || 0
      const attendanceRate = expectedDays > 0 ? (presentDays / expectedDays) * 100 : 0
      const totalHoursWorked = attendanceData?.reduce((acc, a) => acc + (a.working_hours || 0), 0) || 0

      // Calculate evaluation metrics
      const { data: evaluationData } = await supabase
        .from('intern_evaluations')
        .select('overall_score')
        .eq('intern_id', internId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)

      const avgEvaluationScore = evaluationData && evaluationData.length > 0
        ? evaluationData.reduce((acc, e) => acc + e.overall_score, 0) / evaluationData.length
        : 0

      // Calculate productivity score (weighted average)
      const productivityScore = (
        (completionRate * 0.4) +
        (attendanceRate * 0.3) +
        (avgEvaluationScore * 20 * 0.3) // Convert 1-5 scale to percentage
      )

      // Determine trend direction (compare with previous period)
      const prevPeriodStart = new Date(periodStart)
      const prevPeriodEnd = new Date(periodEnd)
      const periodDiff = prevPeriodEnd.getTime() - prevPeriodStart.getTime()
      
      prevPeriodStart.setTime(prevPeriodStart.getTime() - periodDiff)
      prevPeriodEnd.setTime(prevPeriodEnd.getTime() - periodDiff)

      const { data: prevMetrics } = await supabase
        .from('intern_performance_metrics')
        .select('productivity_score')
        .eq('intern_id', internId)
        .eq('period_type', periodType)
        .eq('period_start', prevPeriodStart.toISOString().split('T')[0])
        .single()

      let trendDirection: 'up' | 'down' | 'stable' = 'stable'
      if (prevMetrics?.productivity_score) {
        const diff = productivityScore - prevMetrics.productivity_score
        if (diff > 5) trendDirection = 'up'
        else if (diff < -5) trendDirection = 'down'
      }

      const metrics: PerformanceMetrics = {
        intern_id: internId,
        period_type: periodType,
        period_start: periodStart,
        period_end: periodEnd,
        tasks_assigned: tasksAssigned,
        tasks_completed: tasksCompleted,
        tasks_overdue: tasksOverdue,
        completion_rate: Math.round(completionRate * 100) / 100,
        avg_completion_time_hours: Math.round(avgCompletionTime * 100) / 100,
        expected_days: expectedDays,
        present_days: presentDays,
        absent_days: absentDays,
        attendance_rate: Math.round(attendanceRate * 100) / 100,
        total_hours_worked: Math.round(totalHoursWorked * 100) / 100,
        avg_evaluation_score: Math.round(avgEvaluationScore * 100) / 100,
        evaluation_count: evaluationData?.length || 0,
        productivity_score: Math.round(productivityScore * 100) / 100,
        trend_direction: trendDirection
      }

      // Store metrics
      const { error: insertError } = await supabase
        .from('intern_performance_metrics')
        .upsert(metrics, { 
          onConflict: 'intern_id,period_type,period_start',
          ignoreDuplicates: false 
        })

      if (insertError) throw insertError

      return { success: true, metrics }
    } catch (error) {
      console.error('Error calculating performance metrics:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Generate productivity insights and alerts
   */
  static async generateProductivityInsights(
    userId: string
  ): Promise<{ success: boolean; insights?: ProductivityInsight[]; error?: string }> {
    try {
      const supabase = await createClient()
      const insights: ProductivityInsight[] = []

      // Get current analytics data
      const { data: analyticsData } = await supabase
        .from('intern_analytics_summary')
        .select('*')

      if (!analyticsData) return { success: true, insights: [] }

      // Rule 1: Low completion rate alert
      const lowPerformers = analyticsData.filter(intern => 
        intern.completion_rate < 70 && intern.total_tasks > 5
      )

      if (lowPerformers.length > 0) {
        insights.push({
          type: 'low_completion_rate',
          severity: 'high',
          title: `${lowPerformers.length} intern(s) with low completion rate`,
          description: 'Interns with completion rate below 70% need attention',
          affected_interns: lowPerformers.map(i => i.id),
          data: { threshold: 70, count: lowPerformers.length }
        })
      }

      // Rule 2: Poor attendance alert
      const poorAttendance = analyticsData.filter(intern => 
        intern.attendance_rate < 80 && intern.total_days > 10
      )

      if (poorAttendance.length > 0) {
        insights.push({
          type: 'poor_attendance',
          severity: 'medium',
          title: `${poorAttendance.length} intern(s) with poor attendance`,
          description: 'Interns with attendance below 80% may need support',
          affected_interns: poorAttendance.map(i => i.id),
          data: { threshold: 80, count: poorAttendance.length }
        })
      }

      // Rule 3: Top performers recognition
      const topPerformers = analyticsData
        .filter(intern => 
          intern.completion_rate >= 90 && 
          intern.attendance_rate >= 95 && 
          intern.total_tasks >= 10
        )
        .slice(0, 5)

      if (topPerformers.length > 0) {
        insights.push({
          type: 'top_performers',
          severity: 'low',
          title: `${topPerformers.length} top performer(s) identified`,
          description: 'Interns excelling in both completion rate and attendance',
          affected_interns: topPerformers.map(i => i.id),
          data: { count: topPerformers.length }
        })
      }

      // Rule 4: Overdue tasks alert
      const overdueIssues = analyticsData.filter(intern => 
        intern.overdue_tasks > 3
      )

      if (overdueIssues.length > 0) {
        insights.push({
          type: 'overdue_tasks',
          severity: 'high',
          title: `${overdueIssues.length} intern(s) with multiple overdue tasks`,
          description: 'Interns with more than 3 overdue tasks need immediate attention',
          affected_interns: overdueIssues.map(i => i.id),
          data: { threshold: 3, count: overdueIssues.length }
        })
      }

      // Rule 5: No recent activity alert
      const inactiveInterns = analyticsData.filter(intern => {
        const lastActivity = intern.last_task_completion || intern.last_attendance
        if (!lastActivity) return true
        const daysSinceActivity = (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceActivity > 7
      })

      if (inactiveInterns.length > 0) {
        insights.push({
          type: 'inactive_interns',
          severity: 'medium',
          title: `${inactiveInterns.length} intern(s) with no recent activity`,
          description: 'Interns with no activity in the last 7 days',
          affected_interns: inactiveInterns.map(i => i.id),
          data: { threshold_days: 7, count: inactiveInterns.length }
        })
      }

      // Store insights as alerts
      for (const insight of insights) {
        for (const internId of insight.affected_interns) {
          await supabase
            .from('analytics_alerts')
            .upsert({
              intern_id: internId,
              alert_type: insight.type,
              severity: insight.severity,
              title: insight.title,
              description: insight.description,
              data: insight.data,
              status: 'active',
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            }, { 
              onConflict: 'intern_id,alert_type',
              ignoreDuplicates: false 
            })
        }
      }

      // Log activity
      await logActivity({
        userId,
        action: 'generate_productivity_insights',
        entityType: 'analytics',
        entityId: 'system',
        metadata: { insights_count: insights.length },
        category: 'action'
      })

      return { success: true, insights }
    } catch (error) {
      console.error('Error generating productivity insights:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Compare multiple interns across key metrics
   */
  static async compareInterns(
    internIds: string[],
    comparisonType: string,
    userId: string
  ): Promise<{ success: boolean; comparison?: ComparisonResult; error?: string }> {
    try {
      const supabase = await createClient()

      // Get analytics data for selected interns
      const { data: analyticsData } = await supabase
        .from('intern_analytics_summary')
        .select('*')
        .in('id', internIds)

      if (!analyticsData || analyticsData.length === 0) {
        return { success: false, error: 'No data found for selected interns' }
      }

      // Get weekly trends for comparison
      const { data: trendsData } = await supabase
        .from('weekly_productivity_trends')
        .select('*')
        .in('intern_id', internIds)
        .gte('week_start', new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('week_start', { ascending: true })

      const comparison: ComparisonResult = {
        intern_ids: internIds,
        comparison_type: comparisonType,
        metrics: {
          completion_rate: analyticsData.map(intern => ({
            intern_id: intern.id,
            intern_name: intern.full_name,
            value: intern.completion_rate,
            rank: 0 // Will be calculated below
          })),
          attendance_rate: analyticsData.map(intern => ({
            intern_id: intern.id,
            intern_name: intern.full_name,
            value: intern.attendance_rate,
            rank: 0
          })),
          avg_evaluation_score: analyticsData.map(intern => ({
            intern_id: intern.id,
            intern_name: intern.full_name,
            value: intern.avg_evaluation_score,
            rank: 0
          })),
          total_tasks: analyticsData.map(intern => ({
            intern_id: intern.id,
            intern_name: intern.full_name,
            value: intern.total_tasks,
            rank: 0
          }))
        },
        trends: trendsData || [],
        summary: {
          best_performer: '',
          most_improved: '',
          needs_attention: ''
        }
      }

      // Calculate rankings
      Object.keys(comparison.metrics).forEach(metricKey => {
        const metric = comparison.metrics[metricKey as keyof typeof comparison.metrics]
        metric.sort((a, b) => b.value - a.value)
        metric.forEach((item, index) => {
          item.rank = index + 1
        })
      })

      // Calculate summary insights
      const bestPerformer = analyticsData.reduce((best, current) => {
        const bestScore = (best.completion_rate + best.attendance_rate + best.avg_evaluation_score * 20) / 3
        const currentScore = (current.completion_rate + current.attendance_rate + current.avg_evaluation_score * 20) / 3
        return currentScore > bestScore ? current : best
      })

      comparison.summary.best_performer = bestPerformer.full_name

      // Find most improved (based on trends)
      const trendsByIntern = trendsData?.reduce((acc, trend) => {
        if (!acc[trend.intern_id]) acc[trend.intern_id] = []
        acc[trend.intern_id].push(trend)
        return acc
      }, {} as Record<string, any[]>) || {}

      let maxImprovement = -Infinity;
      let mostImprovedIntern = '';

      (Object.entries(trendsByIntern) as [string, any[]][]).forEach(([internId, trends]) => {
        if (trends.length >= 2) {
          const recent = trends.slice(-3).reduce((acc, t) => acc + t.completion_rate, 0) / 3
          const older = trends.slice(0, 3).reduce((acc, t) => acc + t.completion_rate, 0) / 3
          const improvement = recent - older
          
          if (improvement > maxImprovement) {
            maxImprovement = improvement
            const intern = analyticsData.find(i => i.id === internId)
            mostImprovedIntern = intern?.full_name || ''
          }
        }
      })

      comparison.summary.most_improved = mostImprovedIntern

      // Find intern needing attention
      const needsAttention = analyticsData.reduce((worst, current) => {
        const worstScore = (worst.completion_rate + worst.attendance_rate) / 2
        const currentScore = (current.completion_rate + current.attendance_rate) / 2
        return currentScore < worstScore ? current : worst
      })

      comparison.summary.needs_attention = needsAttention.full_name

      // Store comparison
      const { data: savedComparison } = await supabase
        .from('intern_comparisons')
        .insert({
          comparison_name: `Comparison ${new Date().toLocaleDateString()}`,
          intern_ids: internIds,
          comparison_type: comparisonType,
          metrics: comparison,
          created_by: userId
        })
        .select()
        .single()

      // Log activity
      await logActivity({
        userId,
        action: 'compare_interns',
        entityType: 'intern_comparison',
        entityId: savedComparison?.id || 'unknown',
        metadata: { intern_count: internIds.length, comparison_type: comparisonType },
        category: 'action'
      })

      return { success: true, comparison }
    } catch (error) {
      console.error('Error comparing interns:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Generate predictive indicators for risk assessment
   */
  static async generatePredictiveIndicators(
    internId: string,
    userId: string
  ): Promise<{ success: boolean; indicators?: PredictiveIndicator[]; error?: string }> {
    try {
      const supabase = await createClient()
      const indicators: PredictiveIndicator[] = []

      // Get recent performance data
      const { data: recentMetrics } = await supabase
        .from('intern_performance_metrics')
        .select('*')
        .eq('intern_id', internId)
        .eq('period_type', 'weekly')
        .order('period_start', { ascending: false })
        .limit(4)

      if (!recentMetrics || recentMetrics.length < 2) {
        return { success: true, indicators: [] }
      }

      // Predict deadline miss risk
      const recentCompletionRates = recentMetrics.map(m => m.completion_rate)
      const avgCompletionRate = recentCompletionRates.reduce((a, b) => a + b, 0) / recentCompletionRates.length
      const completionTrend = recentCompletionRates[0] - recentCompletionRates[recentCompletionRates.length - 1]

      if (avgCompletionRate < 70 || completionTrend < -10) {
        const riskLevel = avgCompletionRate < 50 ? 'high' : 'medium'
        const probability = Math.max(0.1, Math.min(0.9, (100 - avgCompletionRate) / 100))

        indicators.push({
          intern_id: internId,
          indicator_type: 'deadline_miss_risk',
          risk_level: riskLevel,
          probability_score: probability,
          prediction_horizon_days: 14,
          factors: {
            avg_completion_rate: avgCompletionRate,
            completion_trend: completionTrend,
            recent_overdue_tasks: recentMetrics[0]?.tasks_overdue || 0
          },
          confidence_interval: {
            lower: Math.max(0, probability - 0.1),
            upper: Math.min(1, probability + 0.1)
          }
        })
      }

      // Predict attendance risk
      const recentAttendanceRates = recentMetrics.map(m => m.attendance_rate)
      const avgAttendanceRate = recentAttendanceRates.reduce((a, b) => a + b, 0) / recentAttendanceRates.length
      const attendanceTrend = recentAttendanceRates[0] - recentAttendanceRates[recentAttendanceRates.length - 1]

      if (avgAttendanceRate < 85 || attendanceTrend < -5) {
        const riskLevel = avgAttendanceRate < 70 ? 'high' : 'medium'
        const probability = Math.max(0.1, Math.min(0.9, (100 - avgAttendanceRate) / 100))

        indicators.push({
          intern_id: internId,
          indicator_type: 'attendance_risk',
          risk_level: riskLevel,
          probability_score: probability,
          prediction_horizon_days: 7,
          factors: {
            avg_attendance_rate: avgAttendanceRate,
            attendance_trend: attendanceTrend,
            consecutive_absences: 0 // Would need additional query
          },
          confidence_interval: {
            lower: Math.max(0, probability - 0.15),
            upper: Math.min(1, probability + 0.15)
          }
        })
      }

      // Predict productivity decline
      const recentProductivityScores = recentMetrics.map(m => m.productivity_score)
      const productivityTrend = recentProductivityScores.length >= 3 
        ? (recentProductivityScores[0] - recentProductivityScores[2]) / 2
        : 0

      if (productivityTrend < -5) {
        const riskLevel = productivityTrend < -15 ? 'high' : 'medium'
        const probability = Math.max(0.2, Math.min(0.8, Math.abs(productivityTrend) / 20))

        indicators.push({
          intern_id: internId,
          indicator_type: 'productivity_decline',
          risk_level: riskLevel,
          probability_score: probability,
          prediction_horizon_days: 21,
          factors: {
            productivity_trend: productivityTrend,
            current_score: recentProductivityScores[0],
            weeks_declining: recentProductivityScores.filter((score, i) => 
              i > 0 && score < recentProductivityScores[i - 1]
            ).length
          },
          confidence_interval: {
            lower: Math.max(0, probability - 0.2),
            upper: Math.min(1, probability + 0.2)
          }
        })
      }

      // Store indicators
      for (const indicator of indicators) {
        await supabase
          .from('predictive_indicators')
          .insert({
            ...indicator,
            model_version: '1.0',
            expires_at: new Date(Date.now() + indicator.prediction_horizon_days * 24 * 60 * 60 * 1000).toISOString()
          })
      }

      // Log activity
      await logActivity({
        userId,
        action: 'generate_predictive_indicators',
        entityType: 'predictive_indicator',
        entityId: internId,
        metadata: { indicators_count: indicators.length },
        category: 'action'
      })

      return { success: true, indicators }
    } catch (error) {
      console.error('Error generating predictive indicators:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get active alerts for dashboard
   */
  static async getActiveAlerts(
    userId: string,
    filters?: { severity?: string; type?: string }
  ): Promise<{ success: boolean; alerts?: AnalyticsAlert[]; error?: string }> {
    try {
      const supabase = await createClient()

      let query = supabase
        .from('analytics_alerts')
        .select(`
          *,
          intern:intern_profiles!analytics_alerts_intern_id_fkey(id, full_name, cohort)
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters?.severity) {
        query = query.eq('severity', filters.severity)
      }
      if (filters?.type) {
        query = query.eq('alert_type', filters.type)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, alerts: data || [] }
    } catch (error) {
      console.error('Error fetching active alerts:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}