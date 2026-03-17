import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logActivity } from '@/lib/logger'
import { getUserRole } from '@/lib/permissions'
import { createNotification } from '@/modules/notifications/notificationsService'

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

    const role = await getUserRole(user.id)
    
    // Check task access
    let taskQuery = supabase.from('tasks').select('id, assigned_to').eq('id', taskId)
    if (role !== 'admin') {
      // Interns can only see threads for their assigned tasks
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

    // Get threads with comment counts and unread status
    const { data: threads, error } = await supabase
      .from('collaboration_threads')
      .select(`
        *,
        created_by_profile:users!collaboration_threads_created_by_fkey(id, email),
        resolved_by_profile:users!collaboration_threads_resolved_by_fkey(id, email),
        comment_count:collaboration_comments(count),
        latest_comment:collaboration_comments(created_at, author_id)
      `)
      .eq('task_id', taskId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    // Add unread status (simplified - in production, track per-user read status)
    const threadsWithUnread = threads?.map(thread => ({
      ...thread,
      has_unread: thread.latest_comment?.author_id !== user.id
    })) || []

    return NextResponse.json({
      threads: threadsWithUnread,
      total: threads?.length || 0
    })

  } catch (error) {
    console.error('Error fetching collaboration threads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { task_id, title, initial_comment, mentions = [] } = body

    if (!task_id || !title || !initial_comment) {
      return NextResponse.json(
        { error: 'task_id, title, and initial_comment are required' },
        { status: 400 }
      )
    }

    const role = await getUserRole(user.id)
    
    // Check task access
    let taskQuery = supabase.from('tasks').select('id, assigned_to, title').eq('id', task_id)
    if (role !== 'admin') {
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

    // Create thread
    const { data: thread, error: threadError } = await supabase
      .from('collaboration_threads')
      .insert([{
        task_id,
        title,
        created_by: user.id
      }])
      .select()
      .single()

    if (threadError) throw threadError

    // Create initial comment
    const { data: comment, error: commentError } = await supabase
      .from('collaboration_comments')
      .insert([{
        thread_id: thread.id,
        content: initial_comment,
        author_id: user.id,
        mentions
      }])
      .select(`
        *,
        author:users!collaboration_comments_author_id_fkey(id, email)
      `)
      .single()

    if (commentError) throw commentError

    // Send notifications to mentioned users
    if (mentions.length > 0) {
      for (const mentionedUserId of mentions) {
        await createNotification({
          userId: mentionedUserId,
          type: 'collaboration_mention',
          message: `You were mentioned in "${title}" on task "${task.title}"`
        })
      }
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'create_collaboration_thread',
      entityType: 'collaboration_thread',
      entityId: thread.id,
      metadata: {
        task_id,
        title,
        mentions_count: mentions.length
      }
    })

    return NextResponse.json({
      thread,
      comment
    })

  } catch (error) {
    console.error('Error creating collaboration thread:', error)
    return NextResponse.json(
      { error: 'Failed to create thread' },
      { status: 500 }
    )
  }
}