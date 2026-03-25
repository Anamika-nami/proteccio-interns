/**
 * AUTOMATION RULE BY ID API
 * 
 * Endpoints:
 * - GET /api/automation/rules/[id] - Get rule by ID
 * - PATCH /api/automation/rules/[id] - Update rule
 * - DELETE /api/automation/rules/[id] - Delete rule (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/permissions'
import { z } from 'zod'

const updateRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  priority: z.number().optional(),
  is_active: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Await params
    const { id } = await params
    
    const { data: rule, error } = await supabase
      .from('automation_rules')
      .select(`
        *,
        rule_conditions (*),
        rule_actions (*)
      `)
      .eq('id', id)
      .eq('is_deleted', false)
      .single()
    
    if (error || !rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }
    
    return NextResponse.json(rule)
    
  } catch (error) {
    console.error('Error in GET /api/automation/rules/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Await params
    const { id } = await params
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateRuleSchema.parse(body)
    
    // Update rule
    const { data: rule, error } = await supabase
      .from('automation_rules')
      .update(validatedData)
      .eq('id', id)
      .eq('is_deleted', false)
      .select(`
        *,
        rule_conditions (*),
        rule_actions (*)
      `)
      .single()
    
    if (error || !rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }
    
    return NextResponse.json(rule)
    
  } catch (error) {
    console.error('Error in PATCH /api/automation/rules/[id]:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Await params
    const { id } = await params
    
    // Soft delete rule
    const { data: rule, error } = await supabase
      .from('automation_rules')
      .update({ 
        is_deleted: true,
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error || !rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Rule deleted successfully' })
    
  } catch (error) {
    console.error('Error in DELETE /api/automation/rules/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
