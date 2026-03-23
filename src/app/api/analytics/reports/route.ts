import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/permissions'
import { logActivity } from '@/lib/logger'
import { z } from 'zod'

const reportSchema = z.object({
  report_type: z.enum(['weekly_activity', 'monthly_productivity', 'task_completion', 'attendance_summary']),
  title: z.string().min(1),
  parameters: z.object({
    date_range: z.object({
      start: z.string(),
      end: z.string()
    }),
    intern_ids: z.array(z.string().uuid()).optional(),
    cohort: z.string().optional(),
    include_charts: z.boolean().default(true),
    format: z.enum(['pdf', 'csv', 'xlsx']).default('pdf')
  }),
  is_scheduled: z.boolean().default(false),
  schedule_cron: z.string().optional()
})

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = reportSchema.parse(body)

    // Create report record
    const { data: report, error } = await supabase
      .from('analytics_reports')
      .insert({
        report_type: validatedData.report_type,
        title: validatedData.title,
        parameters: validatedData.parameters,
        is_scheduled: validatedData.is_scheduled,
        schedule_cron: validatedData.schedule_cron,
        generated_by: user.id,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // In a real implementation, this would trigger a background job
    // For now, we'll simulate report generation
    setTimeout(async () => {
      try {
        const reportData = await generateReportData(validatedData.report_type, validatedData.parameters)
        
        // Simulate file generation and upload
        const fileUrl = `https://storage.example.com/reports/${report.id}.${validatedData.parameters.format}`
        const fileSize = Math.floor(Math.random() * 1000000) + 100000 // Random size between 100KB-1MB

        await supabase
          .from('analytics_reports')
          .update({
            status: 'completed',
            file_url: fileUrl,
            file_size_bytes: fileSize,
            completed_at: new Date().toISOString()
          })
          .eq('id', report.id)

        // Log activity
        await logActivity({
          userId: user.id,
          action: 'generate_analytics_report',
          entityType: 'analytics_report',
          entityId: report.id,
          metadata: { 
            report_type: validatedData.report_type,
            format: validatedData.parameters.format
          },
          category: 'action'
        })
      } catch (error) {
        console.error('Error generating report:', error)
        await supabase
          .from('analytics_reports')
          .update({ status: 'failed' })
          .eq('id', report.id)
      }
    }, 2000) // 2 second delay to simulate processing

    return NextResponse.json({
      report,
      message: 'Report generation started'
    })

  } catch (error) {
    console.error('Error in POST /api/analytics/reports:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const reportType = searchParams.get('report_type')
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('analytics_reports')
      .select(`
        *,
        generated_by_user:users!analytics_reports_generated_by_fkey(id, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (status) {
      query = query.eq('status', status)
    }
    if (reportType) {
      query = query.eq('report_type', reportType)
    }

    const { data: reports, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      reports: reports || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Error in GET /api/analytics/reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate report data
async function generateReportData(reportType: string, parameters: any) {
  const supabase = await createClient()
  
  switch (reportType) {
    case 'weekly_activity':
      return await generateWeeklyActivityReport(supabase, parameters)
    case 'monthly_productivity':
      return await generateMonthlyProductivityReport(supabase, parameters)
    case 'task_completion':
      return await generateTaskCompletionReport(supabase, parameters)
    case 'attendance_summary':
      return await generateAttendanceSummaryReport(supabase, parameters)
    default:
      throw new Error(`Unknown report type: ${reportType}`)
  }
}

async function generateWeeklyActivityReport(supabase: any, parameters: any) {
  const { data: weeklyData } = await supabase
    .from('weekly_productivity_trends')
    .select('*')
    .gte('week_start', parameters.date_range.start)
    .lte('week_start', parameters.date_range.end)
    .order('week_start', { ascending: true })

  return {
    title: 'Weekly Activity Report',
    period: `${parameters.date_range.start} to ${parameters.date_range.end}`,
    data: weeklyData || [],
    summary: {
      total_weeks: weeklyData?.length || 0,
      avg_completion_rate: weeklyData?.reduce((acc: number, w: any) => acc + w.completion_rate, 0) / (weeklyData?.length || 1) || 0
    }
  }
}

async function generateMonthlyProductivityReport(supabase: any, parameters: any) {
  const { data: monthlyData } = await supabase
    .from('intern_performance_metrics')
    .select('*')
    .eq('period_type', 'monthly')
    .gte('period_start', parameters.date_range.start)
    .lte('period_start', parameters.date_range.end)
    .order('period_start', { ascending: true })

  return {
    title: 'Monthly Productivity Report',
    period: `${parameters.date_range.start} to ${parameters.date_range.end}`,
    data: monthlyData || [],
    summary: {
      total_months: monthlyData?.length || 0,
      avg_productivity_score: monthlyData?.reduce((acc: number, m: any) => acc + m.productivity_score, 0) / (monthlyData?.length || 1) || 0
    }
  }
}

async function generateTaskCompletionReport(supabase: any, parameters: any) {
  let query = supabase
    .from('tasks')
    .select(`
      *,
      assigned_intern:intern_profiles!tasks_assigned_to_fkey(id, full_name, cohort)
    `)
    .gte('created_at', parameters.date_range.start)
    .lte('created_at', parameters.date_range.end)

  if (parameters.intern_ids?.length > 0) {
    query = query.in('assigned_to', parameters.intern_ids)
  }

  const { data: tasks } = await query

  return {
    title: 'Task Completion Report',
    period: `${parameters.date_range.start} to ${parameters.date_range.end}`,
    data: tasks || [],
    summary: {
      total_tasks: tasks?.length || 0,
      completed_tasks: tasks?.filter((t: any) => t.status === 'done').length || 0,
      completion_rate: tasks?.length > 0 ? (tasks.filter((t: any) => t.status === 'done').length / tasks.length) * 100 : 0
    }
  }
}

async function generateAttendanceSummaryReport(supabase: any, parameters: any) {
  let query = supabase
    .from('attendance')
    .select(`
      *,
      intern:intern_profiles!attendance_intern_id_fkey(id, full_name, cohort)
    `)
    .gte('date', parameters.date_range.start)
    .lte('date', parameters.date_range.end)

  if (parameters.intern_ids?.length > 0) {
    query = query.in('intern_id', parameters.intern_ids)
  }

  const { data: attendance } = await query

  return {
    title: 'Attendance Summary Report',
    period: `${parameters.date_range.start} to ${parameters.date_range.end}`,
    data: attendance || [],
    summary: {
      total_days: attendance?.length || 0,
      present_days: attendance?.filter((a: any) => a.status === 'present').length || 0,
      attendance_rate: attendance?.length > 0 ? (attendance.filter((a: any) => a.status === 'present').length / attendance.length) * 100 : 0
    }
  }
}