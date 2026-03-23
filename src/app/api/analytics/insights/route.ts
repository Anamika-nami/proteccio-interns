import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AnalyticsService } from '@/services/analyticsService'
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

    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity') || undefined
    const type = searchParams.get('type') || undefined

    // Get active alerts
    const alertsResult = await AnalyticsService.getActiveAlerts(user.id, { severity, type })
    if (!alertsResult.success) {
      return NextResponse.json({ error: alertsResult.error }, { status: 500 })
    }

    return NextResponse.json({
      alerts: alertsResult.alerts || [],
      summary: {
        total: alertsResult.alerts?.length || 0,
        by_severity: {
          critical: alertsResult.alerts?.filter(a => a.severity === 'critical').length || 0,
          high: alertsResult.alerts?.filter(a => a.severity === 'high').length || 0,
          medium: alertsResult.alerts?.filter(a => a.severity === 'medium').length || 0,
          low: alertsResult.alerts?.filter(a => a.severity === 'low').length || 0
        },
        by_type: alertsResult.alerts?.reduce((acc, alert) => {
          acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1
          return acc
        }, {} as Record<string, number>) || {}
      }
    })

  } catch (error) {
    console.error('Error in GET /api/analytics/insights:', error)
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

    // Generate new productivity insights
    const insightsResult = await AnalyticsService.generateProductivityInsights(user.id)
    if (!insightsResult.success) {
      return NextResponse.json({ error: insightsResult.error }, { status: 500 })
    }

    return NextResponse.json({
      insights: insightsResult.insights || [],
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in POST /api/analytics/insights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}