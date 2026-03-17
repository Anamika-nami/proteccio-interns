import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logActivity } from '@/lib/logger'
import { getUserRole } from '@/lib/permissions'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: threadId } = await params
    const body = await request.json()
    const { resolution_note } = body

    // Get thread details
    const { data: thread } = await supabase
      .from('collaboration_threads')
      .select('id, task_id, created_by, title')
      .eq('id', threadId)
      .single()

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Check permissions - admin or thread creator can resolve
    const role = await getUserRole(user.id)
    const canResolve = role === 'admin' || thread.created_by === user.id

    if (!canResolve) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update thread status
    const { data: updatedThread, error } = await supabase
      .from('collaboration_threads')
      .update({
        status: 'resolved',
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', threadId)
      .select(`
        *,
        created_by_profile:users!collaboration_threads_created_by_fkey(id, email),
        resolved_by_profile:users!collaboration_threads_resolved_by_fkey(id, email)
      `)
      .single()

    if (error) throw error

    // Add resolution comment if note provided
    if (resolution_note) {
      await supabase
        .from('collaboration_comments')
        .insert([{
          thread_id: threadId,
          content: `**Thread resolved:** ${resolution_note}`,
          author_id: user.id,
          mentions: [],
          attachments: []
        }])
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'resolve_collaboration_thread',
      entityType: 'collaboration_thread',
      entityId: threadId,
      metadata: {
        thread_title: thread.title,
        resolution_note
      }
    })

    return NextResponse.json({ thread: updatedThread })

  } catch (error) {
    console.error('Error resolving thread:', error)
    return NextResponse.json(
      { error: 'Failed to resolve thread' },
      { status: 500 }
    )
  }
}