import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { taskEventSchema } from '@/lib/validations'
import { getUserRole } from '@/lib/permissions'

/**
 * GET /api/task-events
 * 
 * Retrieves task event timeline.
 * 
 * Query Parameters:
 * - task_id: Filter by task (required)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('task_id')

    if (!taskId) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
    }

    // Fetch task events with user information
    const { data, error } = await supabase
      .from('task_events')
      .select(`
        *,
        users(id, email)
      `)
      .eq('task_id', taskId)
      .order('timestamp', { ascending: true })

    if (error) throw error

    return NextResponse.json({ data: data || [] })

  } catch (error) {
    console.error('Task events fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch task events' }, { status: 500 })
  }
}

/**
 * POST /api/task-events
 * 
 * Creates a new task event.
 * 
 * Use Cases:
 * - Manual event logging
 * - Custom milestone tracking
 * - Admin reviews
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const result = taskEventSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        fields: result.error.flatten().fieldErrors 
      }, { status: 400 })
    }

    const { task_id, event_type, description, metadata } = result.data

    // Verify task exists and user has access
    const { data: task } = await supabase
      .from('tasks')
      .select('id, assigned_to')
      .eq('id', task_id)
      .single()

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const role = await getUserRole(user.id)

    // Access control: Interns can only create events for their own tasks
    if (role !== 'admin') {
      const { data: profile } = await supabase
        .from('intern_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile || task.assigned_to !== profile.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Server-generated timestamp
    const timestamp = new Date().toISOString()

    // Insert task event
    const { data, error } = await supabase
      .from('task_events')
      .insert({
        task_id,
        event_type,
        description,
        metadata,
        created_by: user.id,
        timestamp
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      message: 'Task event created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Task event creation error:', error)
    return NextResponse.json({ error: 'Failed to create task event' }, { status: 500 })
  }
}
