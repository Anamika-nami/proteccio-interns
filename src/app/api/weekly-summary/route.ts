import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/permissions'

/**
 * GET /api/weekly-summary
 * 
 * Retrieves weekly summaries (admin only).
 * 
 * Query Parameters:
 * - intern_id: Filter by intern
 * - week_start_date: Filter by week start
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
    
    // Admin-only access
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const internId = searchParams.get('intern_id')
    const weekStartDate = searchParams.get('week_start_date')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query
    let query = supabase
      .from('weekly_summaries')
      .select(`
        *,
        intern_profiles!inner(id, full_name, cohort)
      `, { count: 'exact' })
      .order('week_start_date', { ascending: false })
      .range(from, to)

    if (internId) query = query.eq('intern_id', internId)
    if (weekStartDate) query = query.eq('week_start_date', weekStartDate)

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
    console.error('Weekly summaries fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch weekly summaries' }, { status: 500 })
  }
}