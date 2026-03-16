import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { workLogSchema, workLogReviewSchema } from '@/lib/validations'
import { logActivity } from '@/lib/logger'
import { getUserRole } from '@/lib/permissions'
import { createNotification } from '@/modules/notifications/notificationsService'

/**
 * GET /api/worklogs
 * 
 * Retrieves work logs based on user role.
 * 
 * Query Parameters:
 * - intern_id: Filter by intern (admin only)
 * - task_id: Filter by task
 * - review_status: Filter by review status
 * - start_date: Filter from date
 * - end_date: Filter to date
 * - page: Page number
 * - limit: Records per page
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getUserRole(user.id)
    const { searchParams } = new URL(request.url)
    
    const internId = searchParams.get('intern_id')
    const taskId = searchParams.get('task_id')
    const reviewStatus = searchParams.get('review_status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query
    let query = supabase
      .from('work_logs')
      .select(`
        *,
        intern_profiles!inner(id, full_name, cohort),
        tasks(id, title, status)
      `, { count: 'exact' })
      .order('date', { ascending: false })
      .range(from, to)

    // Access control: Interns can only see their own logs
    if (role !== 'admin') {
      const { data: profile } = await supabase
        .from('intern_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile) {
        return NextResponse.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 } })
      }
      
      query = query.eq('intern_id', profile.id)
    } else if (internId) {
      query = query.eq('intern_id', internId)
    }

    if (taskId) query = query.eq('task_id', taskId)
    if (reviewStatus) query = query.eq('review_status', reviewStatus)
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Work logs fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch work logs' }, { status: 500 })
  }
}

/**
 * POST /api/worklogs
 * 
 * Creates a new work log entry.
 * 
 * Business Rules:
 * - Interns can only create logs for themselves
 * - Submission timestamp is server-generated
 * - Initial review status is 'pending'
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getUserRole(user.id)
    const body = await request.json()
    
    // Validate input
    const result = workLogSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        fields: result.error.flatten().fieldErrors 
      }, { status: 400 })
    }

    const { intern_id, task_id, date, description, hours_spent, challenges, progress_status } = result.data

    // Security: Interns can only create logs for themselves
    if (role !== 'admin') {
      const { data: profile } = await supabase
        .from('intern_profiles')
        .select('id, user_id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile || profile.id !== intern_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Server-generated timestamp
    const submittedAt = new Date().toISOString()

    // Insert work log
    const { data, error } = await supabase
      .from('work_logs')
      .insert({
        intern_id,
        task_id,
        date: date || new Date().toISOString().split('T')[0],
        description,
        hours_spent,
        challenges,
        progress_status,
        submitted_at: submittedAt,
        review_status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'Work log submitted',
      entityType: 'work_log',
      entityId: data.id,
      metadata: { date: data.date, hours_spent, progress_status }
    })

    // If task is marked as completed, create task event
    if (task_id && progress_status === 'completed') {
      await supabase.from('task_events').insert({
        task_id,
        event_type: 'completed',
        description: 'Task marked as completed in work log',
        created_by: user.id,
        timestamp: submittedAt
      })
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Work log submitted successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Work log creation error:', error)
    return NextResponse.json({ error: 'Failed to create work log' }, { status: 500 })
  }
}

/**
 * PATCH /api/worklogs
 * 
 * Reviews a work log (admin only).
 * 
 * Actions:
 * - Approve: Marks log as approved
 * - Request Revision: Sends back to intern with comments
 */
export async function PATCH(request: Request) {
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
    
    // Validate input
    const result = workLogReviewSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        fields: result.error.flatten().fieldErrors 
      }, { status: 400 })
    }

    const { work_log_id, review_status, admin_comments } = result.data

    // Get work log with intern info
    const { data: workLog } = await supabase
      .from('work_logs')
      .select('*, intern_profiles!inner(user_id)')
      .eq('id', work_log_id)
      .single()

    if (!workLog) {
      return NextResponse.json({ error: 'Work log not found' }, { status: 404 })
    }

    // Update work log
    const { data, error } = await supabase
      .from('work_logs')
      .update({
        review_status,
        admin_comments,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', work_log_id)
      .select()
      .single()

    if (error) throw error

    // Log activity
    await logActivity({
      userId: user.id,
      action: `Work log ${review_status}`,
      entityType: 'work_log',
      entityId: data.id,
      metadata: { review_status, admin_comments }
    })

    // Notify intern
    if (workLog.intern_profiles.user_id) {
      await createNotification({
        userId: workLog.intern_profiles.user_id,
        type: review_status === 'approved' ? 'worklog_approved' : 'worklog_revision',
        message: review_status === 'approved' 
          ? 'Your work log has been approved' 
          : 'Your work log needs revision',
        link: '/intern'
      })
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Work log ${review_status === 'approved' ? 'approved' : 'sent back for revision'}`
    }, { status: 200 })

  } catch (error) {
    console.error('Work log review error:', error)
    return NextResponse.json({ error: 'Failed to review work log' }, { status: 500 })
  }
}
