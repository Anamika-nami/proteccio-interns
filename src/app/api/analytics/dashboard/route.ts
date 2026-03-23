import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsService } from '@/services/analyticsService'
import { getUserRole } from '@/lib/permissions'
import { z } from 'zod'

const dashboardFiltersSchema = z.object({
  cohort: z.string().optional(),
  status: z.string().optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }).optional()
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getUserRole(user.id)
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      cohort: searchParams.get('cohort') || undefined,
      status: searchParams.get('status') || undefined,
      dateRange: searchParams.get('start') && searchParams.get('end') ? {
        start: searchParams.get('start')!,
        end: searchParams.get('end')!
      } : undefined
    }

    // Get analytics summary
    const summaryResult = await AnalyticsService.getInternAnalyticsSummary(filters)
    if (!summaryResult.success) {
      return NextResponse.json({ error: summaryResult.error }, { status: 500 })
    }

    // Get active alerts
    const alertsResult = await AnalyticsService.getActiveAlerts(user.id)
    if (!alertsResult.success) {
      return NextResponse.json({ error: alertsResult.error }, { status: 500 })
    }

    // Calculate KPIs
    const interns = summaryResult.data || []
    const totalInterns = interns.length
    const activeInterns = interns.filter(i => i.status === 'ACTIVE').length
    const avgCompletionRate = interns.length > 0 
      ? interns.reduce((acc, i) => acc + i.completion_rate, 0) / interns.length 
      : 0
    const avgAttendanceRate = interns.length > 0 
      ? interns.reduce((acc, i) => acc + i.attendance_rate, 0) / interns.length 
      : 0
    const totalTasks = interns.reduce((acc, i) => acc + i.total_tasks, 0)
    const completedTasks = interns.reduce((acc, i) => acc + i.completed_tasks, 0)
    const overdueTasks = interns.reduce((acc, i) => acc + i.overdue_tasks, 0)
    const highRiskInterns = interns.filter(i => i.high_risk_indicators > 0).length

    // Get top performers
    const topPerformers = interns
      .filter(i => i.total_tasks >= 5)
      .sort((a, b) => {
        const scoreA = (a.completion_rate + a.attendance_rate + a.avg_evaluation_score * 20) / 3
        const scoreB = (b.completion_rate + b.attendance_rate + b.avg_evaluation_score * 20) / 3
        return scoreB - scoreA
      })
      .slice(0, 5)

    // Get interns needing attention
    const needsAttention = interns
      .filter(i => i.completion_rate < 70 || i.attendance_rate < 80 || i.overdue_tasks > 2)
      .sort((a, b) => {
        const scoreA = a.completion_rate + a.attendance_rate
        const scoreB = b.completion_rate + b.attendance_rate
        return scoreA - scoreB
      })
      .slice(0, 5)

    // Get completion rate distribution
    const completionRateDistribution = [
      { range: '90-100%', count: interns.filter(i => i.completion_rate >= 90).length },
      { range: '80-89%', count: interns.filter(i => i.completion_rate >= 80 && i.completion_rate < 90).length },
      { range: '70-79%', count: interns.filter(i => i.completion_rate >= 70 && i.completion_rate < 80).length },
      { range: '60-69%', count: interns.filter(i => i.completion_rate >= 60 && i.completion_rate < 70).length },
      { range: 'Below 60%', count: interns.filter(i => i.completion_rate < 60).length }
    ]

    // Get weekly trends (last 8 weeks)
    const { data: weeklyTrends } = await supabase
      .from('weekly_productivity_trends')
      .select('*')
      .gte('week_start', new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('week_start', { ascending: true })

    const response = {
      kpis: {
        total_interns: totalInterns,
        active_interns: activeInterns,
        avg_completion_rate: Math.round(avgCompletionRate * 100) / 100,
        avg_attendance_rate: Math.round(avgAttendanceRate * 100) / 100,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        overdue_tasks: overdueTasks,
        high_risk_interns: highRiskInterns
      },
      charts: {
        completion_rate_distribution: completionRateDistribution,
        weekly_trends: weeklyTrends || [],
        top_performers: topPerformers.map(i => ({
          name: i.full_name,
          completion_rate: i.completion_rate,
          attendance_rate: i.attendance_rate,
          score: Math.round((i.completion_rate + i.attendance_rate + i.avg_evaluation_score * 20) / 3)
        }))
      },
      alerts: alertsResult.alerts || [],
      insights: {
        top_performers: topPerformers,
        needs_attention: needsAttention
      },
      metadata: {
        generated_at: new Date().toISOString(),
        filters: filters
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in GET /api/analytics/dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}