import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/permissions'
import { logActivity } from '@/lib/logger'

/**
 * POST /api/weekly-summary/generate
 * 
 * Generates weekly performance summaries (admin only).
 * 
 * Body Parameters:
 * - intern_id: Generate for specific intern (optional, generates for all if omitted)
 * - week_start_date: Week start date (required)
 * - week_end_date: Week end date (required)
 * - admin_remarks: Optional admin remarks
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getUserRole(user.id)
    
    // Admin-only access
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { intern_id, week_start_date, week_end_date, admin_remarks } = body

    if (!week_start_date || !week_end_date) {
      return NextResponse.json({ 
        error: 'Week start and end dates are required' 
      }, { status: 400 })
    }

    if (new Date(week_end_date) < new Date(week_start_date)) {
      return NextResponse.json({ 
        error: 'End date must be after start date' 
      }, { status: 400 })
    }

    // Get interns to generate summaries for
    let internsQuery = supabase
      .from('intern_profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .is('deleted_at', null)

    if (intern_id) {
      internsQuery = internsQuery.eq('id', intern_id)
    }

    const { data: interns, error: internsError } = await internsQuery

    if (internsError) throw internsError

    if (!interns || interns.length === 0) {
      return NextResponse.json({ 
        error: 'No active interns found' 
      }, { status: 404 })
    }

    const summaries = []
    const generatedAt = new Date().toISOString()

    // Generate summary for each intern
    for (const intern of interns) {
      try {
        // Get tasks completed in the week
        const { data: completedTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('assigned_to', intern.id)
          .eq('status', 'done')
          .gte('completed_at', week_start_date)
          .lte('completed_at', week_end_date)

        // Get all pending tasks
        const { data: pendingTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('assigned_to', intern.id)
          .neq('status', 'done')

        // Get attendance for the week
        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('intern_id', intern.id)
          .gte('date', week_start_date)
          .lte('date', week_end_date)

        // Calculate attendance percentage
        const totalDays = attendance?.length || 0
        const presentDays = attendance?.filter(a => a.status === 'present').length || 0
        const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

        // Get work logs for the week
        const { data: workLogs } = await supabase
          .from('work_logs')
          .select('hours_spent')
          .eq('intern_id', intern.id)
          .gte('date', week_start_date)
          .lte('date', week_end_date)

        // Calculate work log metrics
        const workLogsSubmitted = workLogs?.length || 0
        const workLogsExpected = 5 // 5 working days per week
        const totalHoursLogged = workLogs?.reduce((sum, log) => sum + log.hours_spent, 0) || 0

        // Create summary record
        const summaryData = {
          intern_id: intern.id,
          week_start_date,
          week_end_date,
          tasks_completed: completedTasks?.length || 0,
          tasks_pending: pendingTasks?.length || 0,
          attendance_percentage: Math.round(attendancePercentage * 10) / 10, // Round to 1 decimal
          work_logs_submitted: workLogsSubmitted,
          work_logs_expected: workLogsExpected,
          total_hours_logged: Math.round(totalHoursLogged * 10) / 10, // Round to 1 decimal
          admin_remarks,
          generated_by: user.id,
          generated_at: generatedAt
        }

        // Insert or update summary (upsert to prevent duplicates)
        const { data: summary, error: summaryError } = await supabase
          .from('weekly_summaries')
          .upsert(summaryData, {
            onConflict: 'intern_id,week_start_date'
          })
          .select()
          .single()

        if (summaryError) {
          console.error(`Error creating summary for intern ${intern.id}:`, summaryError)
          continue
        }

        summaries.push(summary)

        // Log activity
        await logActivity({
          userId: user.id,
          action: 'Weekly summary generated',
          entityType: 'weekly_summary',
          entityId: summary.id,
          metadata: { 
            intern_name: intern.full_name,
            week_start_date, 
            week_end_date,
            tasks_completed: summaryData.tasks_completed,
            attendance_percentage: summaryData.attendance_percentage
          }
        })

      } catch (error) {
        console.error(`Error processing intern ${intern.id}:`, error)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      data: summaries,
      message: `Generated ${summaries.length} weekly summary(ies) successfully`
    }, { status: 201 })

  } catch (error) {
    console.error('Weekly summary generation error:', error)
    return NextResponse.json({ error: 'Failed to generate weekly summaries' }, { status: 500 })
  }
}