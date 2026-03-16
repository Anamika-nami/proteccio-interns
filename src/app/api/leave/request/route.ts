import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { leaveRequestSchema } from '@/lib/validations'
import { logActivity } from '@/lib/logger'
import { getUserRole } from '@/lib/permissions'
import { createNotification } from '@/modules/notifications/notificationsService'

/**
 * GET /api/leave/request
 * 
 * Retrieves leave requests based on user role.
 * 
 * Query Parameters:
 * - intern_id: Filter by intern (admin only)
 * - status: Filter by status
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
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        intern_profiles!inner(id, full_name, cohort, user_id)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    // Access control: Interns can only see their own requests
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

    if (status) query = query.eq('status', status)

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
    console.error('Leave requests fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 })
  }
}

/**
 * POST /api/leave/request
 * 
 * Creates a new leave request.
 * 
 * Business Rules:
 * - Interns can only create requests for themselves
 * - End date must be >= start date
 * - Document upload is optional but recommended
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
    const result = leaveRequestSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        fields: result.error.flatten().fieldErrors 
      }, { status: 400 })
    }

    const { intern_id, start_date, end_date, reason, document_url } = result.data

    // Security: Interns can only create requests for themselves
    if (role !== 'admin') {
      const { data: profile } = await supabase
        .from('intern_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile || profile.id !== intern_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Validate date range
    if (new Date(end_date) < new Date(start_date)) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // Check for overlapping leave requests
    const { data: overlapping } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('intern_id', intern_id)
      .eq('status', 'approved')
      .or(`start_date.lte.${end_date},end_date.gte.${start_date}`)

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json({ 
        error: 'You have an overlapping approved leave request' 
      }, { status: 400 })
    }

    // Insert leave request
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        intern_id,
        start_date,
        end_date,
        reason,
        document_url,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'Leave request submitted',
      entityType: 'leave_request',
      entityId: data.id,
      metadata: { start_date, end_date, reason }
    })

    // Notify admins (you can implement admin notification logic here)

    return NextResponse.json({
      success: true,
      data,
      message: 'Leave request submitted successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Leave request creation error:', error)
    return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 })
  }
}
