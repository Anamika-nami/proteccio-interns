// ============================================
// OPTIMIZED DASHBOARD API
// ============================================
// Uses materialized views + caching
// Expected: <200ms response time (was 2000ms+)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/permissions'
import { cache, CacheKeys, CacheTTL, getOrFetch } from '@/lib/cache'

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
    const cohort = searchParams.get('cohort')
    const status = searchParams.get('status')
    
    // Create cache key based on filters
    const cacheKey = CacheKeys.analyticsSummary(
      `${cohort || 'all'}_${status || 'all'}`
    )

    // Try to get from cache first
    const response = await getOrFetch(
      cacheKey,
      async () => {
        // ============================================
        // 1. GET KPIs FROM MATERIALIZED VIEW
        // ============================================
        // Single query instead of 8+ separate queries
        
        const { data: kpiData } = await supabase
          .from('dashboard_kpi_cache')
          .select('*')
          .single()

        // ============================================
        // 2. GET ANALYTICS FROM MATERIALIZED VIEW
        // ============================================
        // Pre-computed aggregations
        
        let analyticsQuery = supabase
          .from('intern_analytics_summary')
          .select('*')
          .order('completion_rate', { ascending: false })

        if (cohort) analyticsQuery = analyticsQuery.eq('cohort', cohort)
        if (status) analyticsQuery = analyticsQuery.eq('status', status)

        const { data: analyticsData } = await analyticsQuery

        // ============================================
        // 3. GET WEEKLY TRENDS (last 8 weeks)
        // ============================================
        
        const { data: trendsData } = await supabase
          .from('weekly_productivity_trends')
          .select('*')
          .gte('week_start', new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('week_start', { ascending: true })
          .limit(100) // Limit to prevent huge payloads

        // ============================================
        // 4. GET ACTIVE ALERTS (cached separately)
        // ============================================
        
        const { data: alertsData } = await supabase
          .from('analytics_alerts')
          .select(`
            id,
            intern_id,
            alert_type,
            severity,
            title,
            description,
            created_at
          `)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .order('severity', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(20) // Only top 20 alerts

        // ============================================
        // 5. COMPUTE DERIVED METRICS (in-memory)
        // ============================================
        
        const interns = analyticsData || []
        
        // Top performers (top 5)
        const topPerformers = interns
          .filter(i => i.total_tasks >= 5)
          .sort((a, b) => {
            const scoreA = (a.completion_rate + a.attendance_rate + a.avg_evaluation_score * 20) / 3
            const scoreB = (b.completion_rate + b.attendance_rate + b.avg_evaluation_score * 20) / 3
            return scoreB - scoreA
          })
          .slice(0, 5)
          .map(i => ({
            id: i.id,
            name: i.full_name,
            completion_rate: i.completion_rate,
            attendance_rate: i.attendance_rate,
            score: Math.round((i.completion_rate + i.attendance_rate + i.avg_evaluation_score * 20) / 3)
          }))

        // Needs attention (bottom 5)
        const needsAttention = interns
          .filter(i => i.completion_rate < 70 || i.attendance_rate < 80 || i.overdue_tasks > 2)
          .sort((a, b) => {
            const scoreA = a.completion_rate + a.attendance_rate
            const scoreB = b.completion_rate + b.attendance_rate
            return scoreA - scoreB
          })
          .slice(0, 5)
          .map(i => ({
            id: i.id,
            name: i.full_name,
            completion_rate: i.completion_rate,
            attendance_rate: i.attendance_rate,
            overdue_tasks: i.overdue_tasks
          }))

        // Completion rate distribution
        const completionRateDistribution = [
          { range: '90-100%', count: interns.filter(i => i.completion_rate >= 90).length },
          { range: '80-89%', count: interns.filter(i => i.completion_rate >= 80 && i.completion_rate < 90).length },
          { range: '70-79%', count: interns.filter(i => i.completion_rate >= 70 && i.completion_rate < 80).length },
          { range: '60-69%', count: interns.filter(i => i.completion_rate >= 60 && i.completion_rate < 70).length },
          { range: 'Below 60%', count: interns.filter(i => i.completion_rate < 60).length }
        ]

        // ============================================
        // 6. BUILD RESPONSE
        // ============================================
        
        return {
          kpis: {
            total_interns: interns.length,
            active_interns: kpiData?.active_interns || 0,
            pending_approval: kpiData?.pending_approval || 0,
            total_projects: kpiData?.total_projects || 0,
            total_tasks: kpiData?.total_tasks || 0,
            completed_tasks: kpiData?.completed_tasks || 0,
            overdue_tasks: kpiData?.overdue_tasks || 0,
            avg_completion_rate: interns.length > 0 
              ? Math.round(interns.reduce((acc, i) => acc + i.completion_rate, 0) / interns.length * 100) / 100
              : 0,
            avg_attendance_rate: interns.length > 0 
              ? Math.round(interns.reduce((acc, i) => acc + i.attendance_rate, 0) / interns.length * 100) / 100
              : 0,
            high_risk_interns: interns.filter(i => i.high_risk_indicators > 0).length
          },
          charts: {
            completion_rate_distribution: completionRateDistribution,
            weekly_trends: trendsData || [],
            top_performers: topPerformers
          },
          alerts: alertsData || [],
          insights: {
            top_performers: topPerformers,
            needs_attention: needsAttention
          },
          metadata: {
            generated_at: new Date().toISOString(),
            cache_hit: false,
            filters: { cohort, status }
          }
        }
      },
      CacheTTL.SHORT // 30 second cache
    )

    // Mark if this was a cache hit
    const isCacheHit = cache.get(cacheKey) !== null
    response.metadata.cache_hit = isCacheHit

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in GET /api/analytics/dashboard-optimized:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================
// CACHE INVALIDATION ENDPOINT
// ============================================
// Call this when data changes

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

    // Invalidate all analytics caches
    cache.invalidatePattern('analytics:.*')
    cache.invalidatePattern('dashboard:.*')

    return NextResponse.json({ 
      success: true, 
      message: 'Cache invalidated' 
    })

  } catch (error) {
    console.error('Error invalidating cache:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
