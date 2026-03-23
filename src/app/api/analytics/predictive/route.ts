import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsService } from '@/services/analyticsService'
import { getUserRole } from '@/lib/permissions'
import { z } from 'zod'

const predictiveSchema = z.object({
  intern_id: z.string().uuid()
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
    const validatedData = predictiveSchema.parse(body)

    // Generate predictive indicators
    const indicatorsResult = await AnalyticsService.generatePredictiveIndicators(
      validatedData.intern_id,
      user.id
    )

    if (!indicatorsResult.success) {
      return NextResponse.json({ error: indicatorsResult.error }, { status: 500 })
    }

    return NextResponse.json({
      indicators: indicatorsResult.indicators || [],
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in POST /api/analytics/predictive:', error)
    
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
    const internId = searchParams.get('intern_id')
    const riskLevel = searchParams.get('risk_level')
    const indicatorType = searchParams.get('indicator_type')

    let query = supabase
      .from('predictive_indicators')
      .select(`
        *,
        intern:intern_profiles!predictive_indicators_intern_id_fkey(id, full_name, cohort)
      `)
      .gt('expires_at', new Date().toISOString())
      .order('probability_score', { ascending: false })

    if (internId) {
      query = query.eq('intern_id', internId)
    }
    if (riskLevel) {
      query = query.eq('risk_level', riskLevel)
    }
    if (indicatorType) {
      query = query.eq('indicator_type', indicatorType)
    }

    const { data: indicators, error } = await query

    if (error) throw error

    // Group indicators by type and risk level for summary
    const summary = {
      total: indicators?.length || 0,
      by_risk_level: {
        high: indicators?.filter(i => i.risk_level === 'high').length || 0,
        medium: indicators?.filter(i => i.risk_level === 'medium').length || 0,
        low: indicators?.filter(i => i.risk_level === 'low').length || 0
      },
      by_type: indicators?.reduce((acc, indicator) => {
        acc[indicator.indicator_type] = (acc[indicator.indicator_type] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      avg_probability: indicators?.length > 0 
        ? indicators.reduce((acc, i) => acc + i.probability_score, 0) / indicators.length 
        : 0
    }

    return NextResponse.json({
      indicators: indicators || [],
      summary
    })

  } catch (error) {
    console.error('Error in GET /api/analytics/predictive:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Batch generate predictive indicators for all active interns
export async function PUT(request: NextRequest) {
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

    // Get all active interns
    const { data: activeInterns } = await supabase
      .from('intern_profiles')
      .select('id')
      .eq('status', 'ACTIVE')
      .is('deleted_at', null)

    if (!activeInterns || activeInterns.length === 0) {
      return NextResponse.json({
        message: 'No active interns found',
        processed: 0
      })
    }

    const results = []
    let successCount = 0
    let errorCount = 0

    // Process each intern
    for (const intern of activeInterns) {
      try {
        const indicatorsResult = await AnalyticsService.generatePredictiveIndicators(
          intern.id,
          user.id
        )
        
        if (indicatorsResult.success) {
          successCount++
          results.push({
            intern_id: intern.id,
            status: 'success',
            indicators_count: indicatorsResult.indicators?.length || 0
          })
        } else {
          errorCount++
          results.push({
            intern_id: intern.id,
            status: 'error',
            error: indicatorsResult.error
          })
        }
      } catch (error) {
        errorCount++
        results.push({
          intern_id: intern.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: 'Batch predictive analysis completed',
      processed: activeInterns.length,
      successful: successCount,
      errors: errorCount,
      results
    })

  } catch (error) {
    console.error('Error in PUT /api/analytics/predictive:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}