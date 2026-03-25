/**
 * AUTOMATION DASHBOARD API
 * 
 * Provides comprehensive statistics and insights for the automation system
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/permissions'
import { DeadlineMonitoringService } from '@/services/automation/DeadlineMonitoringService'
import { JobScheduler } from '@/services/automation/JobScheduler'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify admin role
    const role = await getUserRole(user.id)
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Fetch statistics in parallel
    const [
      rulesStats,
      executionStats,
      deadlineStats,
      alertStats,
      jobStats,
      recentExecutions,
      activeAlerts
    ] = await Promise.all([
      getRulesStatistics(supabase),
      getExecutionStatistics(supabase),
      DeadlineMonitoringService.getDeadlineStatistics(),
      getAlertStatistics(supabase),
      JobScheduler.getJobStatistics(),
      getRecentExecutions(supabase),
      getActiveAlerts(supabase)
    ])
    
    return NextResponse.json({
      rules: rulesStats,
      executions: executionStats,
      deadlines: deadlineStats,
      alerts: alertStats,
      jobs: jobStats,
      recentExecutions: recentExecutions,
      activeAlerts: activeAlerts,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error in GET /api/automation/dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getRulesStatistics(supabase: any) {
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('rule_type, is_active')
    .eq('is_deleted', false)
  
  const stats = {
    total: rules?.length || 0,
    active: rules?.filter((r: any) => r.is_active).length || 0,
    byType: {} as Record<string, number>
  }
  
  rules?.forEach((rule: any) => {
    stats.byType[rule.rule_type] = (stats.byType[rule.rule_type] || 0) + 1
  })
  
  return stats
}

async function getExecutionStatistics(supabase: any) {
  const { data: executions } = await supabase
    .from('rule_execution_log')
    .select('status, execution_time_ms')
    .gte('executed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  
  const stats = {
    total: executions?.length || 0,
    success: executions?.filter((e: any) => e.status === 'success').length || 0,
    failed: executions?.filter((e: any) => e.status === 'failed').length || 0,
    avgExecutionTimeMs: 0
  }
  
  if (executions && executions.length > 0) {
    const totalTime = executions.reduce((sum: number, e: any) => sum + (e.execution_time_ms || 0), 0)
    stats.avgExecutionTimeMs = Math.round(totalTime / executions.length)
  }
  
  return stats
}

async function getAlertStatistics(supabase: any) {
  const { data: alerts } = await supabase
    .from('automation_alerts')
    .select('severity, status')
  
  const stats = {
    total: alerts?.length || 0,
    active: alerts?.filter((a: any) => a.status === 'active').length || 0,
    bySeverity: {} as Record<string, number>
  }
  
  alerts?.forEach((alert: any) => {
    stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1
  })
  
  return stats
}

async function getRecentExecutions(supabase: any) {
  const { data: executions } = await supabase
    .from('rule_execution_log')
    .select(`
      id,
      status,
      conditions_met,
      actions_executed,
      actions_failed,
      execution_time_ms,
      executed_at,
      automation_rules (
        id,
        name,
        rule_type
      )
    `)
    .order('executed_at', { ascending: false })
    .limit(10)
  
  return executions || []
}

async function getActiveAlerts(supabase: any) {
  const { data: alerts } = await supabase
    .from('automation_alerts')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20)
  
  return alerts || []
}
