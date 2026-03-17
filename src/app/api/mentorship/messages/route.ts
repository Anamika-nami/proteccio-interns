import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { mentorshipMessageSchema } from '@/lib/validations'
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
    const conversationId = searchParams.get('conversation_id')
    
    if (!conversationId) {
      return NextResponse.json({ error: 'conversation_id is required' }, { status: 400 })
    }

    // Verify conversation access
    const role = await getUserRole(user.id)
    let conversationQuery = supabase
      .from('mentorship_conversations')
      .select('id, intern_id, mentor_id')
      .eq('id', conversationId)

    if (role === 'intern') {
      const { data: profile } = await supabase
        .from('intern_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      
      conversationQuery = conversationQuery.eq('intern_id', profile.id)
    } else if (role === 'admin') {
      conversationQuery = conversationQuery.eq('mentor_id', user.id)
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data: conversation } = await conversationQuery.single()
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
    }

    // Get messages
    const { data: messages, error } = await supabase
      .from('mentorship_messages')
      .select(`
        *,
        sender:users!mentorship_messages_sender_id_fkey(id, email)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      messages: messages || []
    })

  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
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
    const validatedData = mentorshipMessageSchema.parse(body)

    // Verify conversation access
    const role = await getUserRole(user.id)
    let conversationQuery = supabase
      .from('mentorship_conversations')
      .select('id, intern_id, mentor_id, subject, status')
      .eq('id', validatedData.conversation_id)

    if (role === 'intern') {
      const { data: profile } = await supabase
        .from('intern_profiles')
        .select('id, full_name')
        .eq('user_id', user.id)
        .single()
      
      if (!profile) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      
      conversationQuery = conversationQuery.eq('intern_id', profile.id)
    } else if (role === 'admin') {
      conversationQuery = conversationQuery.eq('mentor_id', user.id)
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { data: conversation } = await conversationQuery.single()
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
    }

    if (conversation.status !== 'open') {
      return NextResponse.json({ error: 'Cannot send messages to resolved conversations' }, { status: 400 })
    }

    // Create message
    const { data: message, error } = await supabase
      .from('mentorship_messages')
      .insert([{
        conversation_id: validatedData.conversation_id,
        sender_id: user.id,
        content: validatedData.content,
        attachments: validatedData.attachments || []
      }])
      .select(`
        *,
        sender:users!mentorship_messages_sender_id_fkey(id, email)
      `)
      .single()

    if (error) throw error

    // Update conversation updated_at
    await supabase
      .from('mentorship_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', validatedData.conversation_id)

    // Send notification to the other party
    const recipientId = role === 'intern' ? conversation.mentor_id : conversation.intern_id
    if (recipientId) {
      await createNotification({
        userId: recipientId,
        type: 'mentorship_message',
        message: `New message in "${conversation.subject}"`
      })
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'create_mentorship_message',
      entityType: 'mentorship_message',
      entityId: message.id,
      metadata: {
        conversation_id: validatedData.conversation_id,
        attachments_count: validatedData.attachments?.length || 0
      }
    })

    return NextResponse.json({ message })

  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}