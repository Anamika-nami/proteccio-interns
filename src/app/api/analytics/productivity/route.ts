import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/permissions'

/**
 * GET /api/analytics/productivity
 * 
 * Retrieves comprehensive productivity analytics.
 * 
 * Query Parameters:
 * - intern_id: Filter by specific intern
 * - start_date: Filter from date
 * - end_date: Filter to date
 * - cohort: Filter by cohort
 * 
 * Returns:
 * - Individual intern metrics
 * - Aggregated statistics
 * - Leaderboard data
 * - Trend analysis
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getUserRole(user.id)
    
    // Admin-only access for full analytics
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const internId = searchParams.get('intern_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const cohort = searchParams.get('cohort')

    // Build base query for productivity dashboard view
    let query = supabase
      .from('v_productivity_dashboard')
      .select('*')
      .order('task_completion_rate', { ascending: false })

    if (internId) query = query.eq('intern_id', internId)
    if (cohort) query = query.eq('cohort', cohort)

    const { data: productivity, error } = await query

    if (error) throw error

    // Get attendance summary
    let attendanceQuery = supabase
      .from('v_attendance_summary')
      .select('*')

    if (internId) attendanceQuery = attendanceQuery.eq('intern_id', internId)
    if (cohort) attendanceQuery = attendanceQuery.eq('cohort', cohort)

    const { data: attendance } = await attendanceQuery

    // Get work log consistency
    let worklogQuery = supabase
      .from('v_worklog_consistency')
      .select('*')

    if (internId) worklogQuery = worklogQuery.eq('intern_id', internId)

    const { data: worklogs } = await worklogQuery

    // Calculate aggregated metrics
    const aggregated = {
      total_interns: productivity?.length || 0,
      avg_attendance: productivity?.reduce((sum, p) => sum + p.attendance_percentage, 0) / (productivity?.length || 1),
      avg_task_completion: productivity?.reduce((sum, p) => sum + p.task_completion_rate, 0) / (productivity?.length || 1),
      total_tasks_completed: productivity?.reduce((sum, p) => sum + p.completed_tasks, 0) || 0,
      total_hours_logged: productivity?.reduce((sum, p) => sum + p.total_hours_logged, 0) || 0,
      avg_hours_per_intern: productivity?.reduce((sum, p) => sum + p.total_hours_logged, 0) / (productivity?.length || 1)
    }

    // Generate leaderboard (top 10 performers)
    const leaderboard = productivity?.slice(0, 10).map((p, index) => ({
      rank: index + 1,
      intern_id: p.intern_id,
      full_name: p.full_name,
      cohort: p.cohort,
      score: calculateProductivityScore(p),
      metrics: {
        attendance: p.attendance_percentage,
        task_completion: p.task_completion_rate,
        hours_logged: p.total_hours_logged
      }
    }))

    // Get recent trends (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: recentAttendance } = await supabase
      .from('attendance')
      .select('date, status')
      .gte('date', thirtyDaysAgoStr)
      .order('date', { ascending: true })

    const { data: recentWorklogs } = await supabase
      .from('work_logs')
      .select('date, hours_spent')
      .gte('date', thirtyDaysAgoStr)
      .order('date', { ascending: true })

    // Group trends by date
    const trendsByDate = groupTrendsByDate(recentAttendance || [], recentWorklogs || [])

    return NextResponse.json({
      productivity: productivity || [],
      attendance: attendance || [],
      worklogs: worklogs || [],
      aggregated,
      leaderboard: leaderboard || [],
      trends: trendsByDate
    })

  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

/**
 * Calculate productivity score based on multiple factors
 * Score = (Attendance% * 0.3) + (Task Completion% * 0.4) + (Hours Logged / 100 * 0.3)
 */
function calculateProductivityScore(metrics: any): number {
  const attendanceScore = metrics.attendance_percentage * 0.3
  const taskScore = metrics.task_completion_rate * 0.4
  const hoursScore = Math.min(metrics.total_hours_logged / 100, 1) * 30 // Cap at 100 hours
  
  return Math.round(attendanceScore + taskScore + hoursScore)
}

/**
 * Group attendance and worklog data by date for trend analysis
 */
function groupTrendsByDate(attendance: any[], worklogs: any[]) {
  const trendMap = new Map()

  // Process attendance
  attendance.forEach(a => {
    if (!trendMap.has(a.date)) {
      trendMap.set(a.date, { date: a.date, present: 0, absent: 0, hours_logged: 0 })
    }
    const trend = trendMap.get(a.date)
    if (a.status === 'present') trend.present++
    else if (a.status === 'absent') trend.absent++
  })

  // Process worklogs
  worklogs.forEach(w => {
    if (!trendMap.has(w.date)) {
      trendMap.set(w.date, { date: w.date, present: 0, absent: 0, hours_logged: 0 })
    }
    const trend = trendMap.get(w.date)
    trend.hours_logged += w.hours_spent
  })

  return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date))
}
