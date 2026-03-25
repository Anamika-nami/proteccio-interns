/**
 * AUTOMATION ALERTS API
 * 
 * Endpoints:
 * - GET /api/automation/alerts - Get alerts for current user
 * - PATCH /api/automation/alerts/[id] - Update alert status
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const severity = searchParams.get('severity')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // Build query
    let query = supabase
      .from('automation_alerts')
      .select('*')
      .eq('target_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (status) query = query.eq('status', status)
    if (severity) query = query.eq('severity', severity)
    
    const { data: alerts, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({
      alerts: alerts || [],
      total: alerts?.length || 0
    })
    
  } catch (error) {
    console.error('Error in GET /api/automation/alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
