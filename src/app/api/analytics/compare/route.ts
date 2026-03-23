import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsService } from '@/services/analyticsService'
import { getUserRole } from '@/lib/permissions'
import { z } from 'zod'

const compareSchema = z.object({
  intern_ids: z.array(z.string().uuid()).min(2).max(10),
  comparison_type: z.string().min(1)
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
    const validatedData = compareSchema.parse(body)

    // Perform comparison
    const comparisonResult = await AnalyticsService.compareInterns(
      validatedData.intern_ids,
      validatedData.comparison_type,
      user.id
    )

    if (!comparisonResult.success) {
      return NextResponse.json({ error: comparisonResult.error }, { status: 500 })
    }

    return NextResponse.json({
      comparison: comparisonResult.comparison,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in POST /api/analytics/compare:', error)
    
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
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Get saved comparisons
    const { data: comparisons, error, count } = await supabase
      .from('intern_comparisons')
      .select(`
        *,
        created_by_user:users!intern_comparisons_created_by_fkey(id, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      comparisons: comparisons || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Error in GET /api/analytics/compare:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}