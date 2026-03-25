/**
 * AUTOMATION EXECUTION API
 * 
 * Endpoints:
 * - POST /api/automation/execute - Manually execute a rule or trigger event processing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/permissions'
import { RuleEngine } from '@/services/automation/RuleEngine'
import { z } from 'zod'

const executeSchema = z.object({
  type: z.enum(['rule', 'event']),
  rule_id: z.string().uuid().optional(),
  event_id: z.string().uuid().optional()
})

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
    const validatedData = executeSchema.parse(body)
    
    if (validatedData.type === 'rule') {
      if (!validatedData.rule_id) {
        return NextResponse.json(
          { error: 'rule_id is required for rule execution' },
          { status: 400 }
        )
      }
      
      // Fetch rule
      const { data: rule, error } = await supabase
        .from('automation_rules')
        .select(`
          *,
          rule_conditions (*),
          rule_actions (*)
        `)
        .eq('id', validatedData.rule_id)
        .eq('is_deleted', false)
        .single()
      
      if (error || !rule) {
        return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
      }
      
      // Execute rule
      const result = await RuleEngine.executeRule(rule)
      
      return NextResponse.json({
        message: 'Rule executed successfully',
        result: result
      })
      
    } else if (validatedData.type === 'event') {
      if (!validatedData.event_id) {
        return NextResponse.json(
          { error: 'event_id is required for event processing' },
          { status: 400 }
        )
      }
      
      // Process event
      await RuleEngine.processEvent(validatedData.event_id)
      
      return NextResponse.json({
        message: 'Event processed successfully'
      })
    }
    
    return NextResponse.json({ error: 'Invalid execution type' }, { status: 400 })
    
  } catch (error) {
    console.error('Error in POST /api/automation/execute:', error)
    
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
