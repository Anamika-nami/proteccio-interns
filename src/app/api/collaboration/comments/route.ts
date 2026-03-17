import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { collaborationCommentSchema } from '@/lib/validations'
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
    const threadId = searchParams.get('thread_id')
    
    if (!threadId) {
      return NextResponse.json({ error: 'thread_id is required' }, { status: 400 })
    }

    // Verify thread access
    const { data: thread } = await supabase
      .from('collaboration_threads')
      .select('id, task_id')
      .eq('id', threadId)
      .single()

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Check task access
    const role = await getUserRole(user.id)
    if (role !== 'admin') {
      const { data: profile } = await supabase
        .from('intern_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const { data: task } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', thread.task_id)
        .eq('assigned_to', profile.id)
        .single()

      if (!task) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get comments
    const { data: comments, error } = await supabase
      .from('collaboration_comments')
      .select(`
        *,
        author:users!collaboration_comments_author_id_fkey(id, email)
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      comments: comments || []
    })

  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
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
    const validatedData = collaborationCommentSchema.parse(body)

    // Verify thread access
    const { data: thread } = await supabase
      .from('collaboration_threads')
      .select('id, task_id, title')
      .eq('id', validatedData.thread_id)
      .single()

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Check task access
    const role = await getUserRole(user.id)
    if (role !== 'admin') {
      const { data: profile } = await supabase
        .from('intern_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const { data: task } = await supabase
        .from('tasks')
        .select('id')
        .eq('id', thread.task_id)
        .eq('assigned_to', profile.id)
        .single()

      if (!task) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('collaboration_comments')
      .insert([{
        thread_id: validatedData.thread_id,
        parent_comment_id: validatedData.parent_comment_id,
        content: validatedData.content,
        author_id: user.id,
        mentions: validatedData.mentions || [],
        attachments: validatedData.attachments || []
      }])
      .select(`
        *,
        author:users!collaboration_comments_author_id_fkey(id, email)
      `)
      .single()

    if (error) throw error

    // Update thread updated_at
    await supabase
      .from('collaboration_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', validatedData.thread_id)

    // Send notifications to mentioned users
    if (validatedData.mentions && validatedData.mentions.length > 0) {
      for (const mentionedUserId of validatedData.mentions) {
        await createNotification({
          userId: mentionedUserId,
          type: 'collaboration_mention',
          message: `You were mentioned in "${thread.title}"`
        })
      }
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'create_collaboration_comment',
      entityType: 'collaboration_comment',
      entityId: comment.id,
      metadata: {
        thread_id: validatedData.thread_id,
        mentions_count: validatedData.mentions?.length || 0,
        attachments_count: validatedData.attachments?.length || 0
      }
    })

    return NextResponse.json({ comment })

  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}