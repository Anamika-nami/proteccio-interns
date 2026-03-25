/**
 * AUTOMATION RULES API
 * 
 * Endpoints:
 * - GET /api/automation/rules - List all rules
 * - POST /api/automation/rules - Create new rule
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/permissions'
import { z } from 'zod'

// Validation schemas
const conditionSchema = z.object({
  condition_group: z.number().optional().default(1),
  group_operator: z.enum(['AND', 'OR']).optional().default('AND'),
  entity_type: z.enum(['intern', 'task', 'attendance', 'worklog', 'evaluation', 'document', 'leave', 'badge']),
  field_name: z.string().min(1),
  operator: z.enum([
    'equals', 'not_equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal',
    'contains', 'not_contains', 'in', 'not_in', 'is_null', 'is_not_null', 'between', 'days_since', 'days_until'
  ]),
  value: z.any(),
  sort_order: z.number().optional().default(0)
})

const actionSchema = z.object({
  action_type: z.enum([
    'send_notification', 'send_email', 'assign_task', 'update_status', 'create_alert',
    'escalate', 'generate_report', 'update_field', 'trigger_webhook', 'create_document_request',
    'assign_badge', 'schedule_evaluation'
  ]),
  config: z.record(z.string(), z.any()),
  sort_order: z.number().optional().default(0),
  max_retries: z.number().optional().default(3),
  retry_delay_seconds: z.number().optional().default(60)
})

const createRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  rule_type: z.enum([
    'task_assignment', 'notification', 'status_update', 'escalation',
    'milestone', 'deadline', 'document', 'recommendation'
  ]),
  trigger_type: z.enum(['event', 'schedule', 'condition']),
  schedule_cron: z.string().optional(),
  priority: z.number().optional().default(0),
  conditions: z.array(conditionSchema),
  actions: z.array(actionSchema)
})

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
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const ruleType = searchParams.get('rule_type')
    const triggerType = searchParams.get('trigger_type')
    const isActive = searchParams.get('is_active')
    
    // Build query
    let query = supabase
      .from('automation_rules')
      .select(`
        *,
        rule_conditions (
          id,
          condition_group,
          group_operator,
          entity_type,
          field_name,
          operator,
          value,
          sort_order
        ),
        rule_actions (
          id,
          action_type,
          config,
          sort_order,
          max_retries,
          retry_delay_seconds
        )
      `)
      .eq('is_deleted', false)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (ruleType) query = query.eq('rule_type', ruleType)
    if (triggerType) query = query.eq('trigger_type', triggerType)
    if (isActive !== null) query = query.eq('is_active', isActive === 'true')
    
    const { data: rules, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({
      rules: rules || [],
      total: rules?.length || 0
    })
    
  } catch (error) {
    console.error('Error in GET /api/automation/rules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = createRuleSchema.parse(body)
    
    // Validate schedule_cron if trigger_type is schedule
    if (validatedData.trigger_type === 'schedule' && !validatedData.schedule_cron) {
      return NextResponse.json(
        { error: 'schedule_cron is required for schedule trigger type' },
        { status: 400 }
      )
    }
    
    // Create rule
    const { data: rule, error: ruleError } = await supabase
      .from('automation_rules')
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        rule_type: validatedData.rule_type,
        trigger_type: validatedData.trigger_type,
        schedule_cron: validatedData.schedule_cron,
        priority: validatedData.priority,
        is_active: true,
        created_by: user.id
      })
      .select()
      .single()
    
    if (ruleError) throw ruleError
    
    // Create conditions
    if (validatedData.conditions.length > 0) {
      const conditions = validatedData.conditions.map(c => ({
        rule_id: rule.id,
        ...c
      }))
      
      const { error: conditionsError } = await supabase
        .from('rule_conditions')
        .insert(conditions)
      
      if (conditionsError) throw conditionsError
    }
    
    // Create actions
    if (validatedData.actions.length > 0) {
      const actions = validatedData.actions.map(a => ({
        rule_id: rule.id,
        ...a
      }))
      
      const { error: actionsError } = await supabase
        .from('rule_actions')
        .insert(actions)
      
      if (actionsError) throw actionsError
    }
    
    // Fetch complete rule with relations
    const { data: completeRule, error: fetchError } = await supabase
      .from('automation_rules')
      .select(`
        *,
        rule_conditions (*),
        rule_actions (*)
      `)
      .eq('id', rule.id)
      .single()
    
    if (fetchError) throw fetchError
    
    return NextResponse.json(completeRule, { status: 201 })
    
  } catch (error) {
    console.error('Error in POST /api/automation/rules:', error)
    
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
