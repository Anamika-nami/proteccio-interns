import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MetricsCalculationService } from '@/services/metricsCalculationService'
import { getUserRole } from '@/lib/permissions'

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

    // Get system health status
    const healthResult = await MetricsCalculationService.getSystemHealth()
    
    if (!healthResult.success) {
      return NextResponse.json({ error: healthResult.error }, { status: 500 })
    }

    return NextResponse.json({
      health: healthResult.health,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in GET /api/analytics/system:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { action } = body

    switch (action) {
      case 'refresh_all':
        const refreshResult = await MetricsCalculationService.refreshAllAnalytics(user.id)
        if (!refreshResult.success) {
          return NextResponse.json({ error: refreshResult.error }, { status: 500 })
        }
        return NextResponse.json({
          message: 'Analytics refresh completed',
          results: refreshResult.results
        })

      case 'calculate_metrics':
        const periodType = body.period_type || 'weekly'
        const metricsResult = await MetricsCalculationService.calculateAllMetrics(user.id, periodType)
        if (!metricsResult.success) {
          return NextResponse.json({ error: metricsResult.error }, { status: 500 })
        }
        return NextResponse.json({
          message: 'Metrics calculation completed',
          processed: metricsResult.processed,
          errors: metricsResult.errors
        })

      case 'cleanup_expired':
        const cleanupResult = await MetricsCalculationService.cleanupExpiredData(user.id)
        if (!cleanupResult.success) {
          return NextResponse.json({ error: cleanupResult.error }, { status: 500 })
        }
        return NextResponse.json({
          message: 'Cleanup completed',
          cleaned: cleanupResult.cleaned
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in POST /api/analytics/system:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}