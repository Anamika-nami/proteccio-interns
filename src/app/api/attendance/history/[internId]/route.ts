import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/permissions'

/**
 * GET /api/attendance/history/:internId
 * 
 * Retrieves attendance history for a specific intern.
 * 
 * Query Parameters:
 * - start_date: Filter from date (YYYY-MM-DD)
 * - end_date: Filter to date (YYYY-MM-DD)
 * - status: Filter by status (present, absent, half_day, leave)
 * - page: Page number (default: 1)
 * - limit: Records per page (default: 30)
 * 
 * Access Control:
 * - Admins can view any intern's history
 * - Interns can only view their own history
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ internId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getUserRole(user.id)
    const { internId } = await params
    const { searchParams } = new URL(request.url)
    
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Security: Interns can only view their own attendance
    if (role !== 'admin') {
      const { data: profile } = await supabase
        .from('intern_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile || profile.id !== internId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Build query
    let query = supabase
      .from('attendance')
      .select('*', { count: 'exact' })
      .eq('intern_id', internId)
      .order('date', { ascending: false })
      .range(from, to)

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) throw error

    // Calculate summary statistics
    const summary = {
      total_days: count || 0,
      present: data?.filter(a => a.status === 'present').length || 0,
      absent: data?.filter(a => a.status === 'absent').length || 0,
      half_day: data?.filter(a => a.status === 'half_day').length || 0,
      leave: data?.filter(a => a.status === 'leave').length || 0,
      total_hours: data?.reduce((sum, a) => sum + (a.working_hours || 0), 0) || 0,
      attendance_percentage: count ? ((data?.filter(a => a.status === 'present').length || 0) / count * 100).toFixed(2) : 0
    }

    return NextResponse.json({
      data: data || [],
      summary,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Attendance history error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch attendance history' 
    }, { status: 500 })
  }
}
