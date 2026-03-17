import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/permissions'
import { AISuggestionService } from '@/services/aiSuggestionService'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const taskId = id

    // Verify task access
    const role = await getUserRole(user.id)
    let taskQuery = supabase
      .from('tasks')
      .select('id, title, description, status, assigned_to')
      .eq('id', taskId)

    if (role !== 'admin') {
      // Interns can only get suggestions for their assigned tasks
      const { data: profile } = await supabase
        .from('intern_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile) {
        return NextResponse.json({ error: 'Intern profile not found' }, { status: 404 })
      }
      
      taskQuery = taskQuery.eq('assigned_to', profile.id)
    }

    const { data: task } = await taskQuery.single()
    if (!task) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 })
    }

    // Generate AI suggestions
    const suggestions = await AISuggestionService.generateTaskSuggestions(taskId, user.id)

    return NextResponse.json({
      suggestions,
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status
      }
    })

  } catch (error) {
    console.error('Error generating task suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}