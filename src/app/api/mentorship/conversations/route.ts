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
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const from = (page - 1) * limit
    const to = from + limit - 1

    const role = await getUserRole(user.id)

    // Build query based on user role
    let query = supabase
      .from('mentorship_conversations')
      .select(`
        *,
        intern:intern_profiles!mentorship_conversations_intern_id_fkey(id, full_name, cohort),
        mentor:users!mentorship_conversations_mentor_id_fkey(id, email),
        message_count:mentorship_messages(count),
        latest_message:mentorship_messages(created_at, sender_id, content)
      `, { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to)

    // Filter by user role
    if (role === 'intern') {
      // Interns see only their conversations
      const { data: profile } = await supabase
        .from('intern_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile) {
        return NextResponse.json({ error: 'Intern profile not found' }, { status: 404 })
      }
      
      query = query.eq('intern_id', profile.id)
    } else if (role === 'admin') {
      // Admins see conversations where they are the mentor
      query = query.eq('mentor_id', user.id)
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Apply filters
    if (status) query = query.eq('status', status)
    if (category) query = query.eq('category', category)

    const { data: conversations, error, count } = await query

    if (error) throw error

    // Add unread message count (simplified - in production, track per-user read status)
    const conversationsWithUnread = conversations?.map(conv => ({
      ...conv,
      unread_count: conv.latest_message?.sender_id !== user.id ? 1 : 0
    })) || []

    return NextResponse.json({
      conversations: conversationsWithUnread,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Error fetching mentorship conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
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

    const role = await getUserRole(user.id)
    
    // Only interns can create conversations
    if (role !== 'intern') {
      return NextResponse.json({ error: 'Only interns can start conversations' }, { status: 403 })
    }

    const body = await request.json()
    const { mentor_id, subject, category, initial_message, priority = 'normal' } = body

    // Validation
    if (!mentor_id || !subject || !category || !initial_message) {
      return NextResponse.json(
        { error: 'mentor_id, subject, category, and initial_message are required' },
        { status: 400 }
      )
    }

    if (!['technical', 'career', 'task_help', 'general'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
    }

    // Get intern profile
    const { data: profile } = await supabase
      .from('intern_profiles')
      .select('id, full_name')
      .eq('user_id', user.id)
      .single()
    
    if (!profile) {
      return NextResponse.json({ error: 'Intern profile not found' }, { status: 404 })
    }

    // Verify mentor exists and is admin
    const { data: mentor } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', mentor_id)
      .single()

    if (!mentor || mentor.role !== 'admin') {
      return NextResponse.json({ error: 'Invalid mentor' }, { status: 400 })
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('mentorship_conversations')
      .insert([{
        intern_id: profile.id,
        mentor_id,
        subject,
        category,
        priority
      }])
      .select(`
        *,
        intern:intern_profiles!mentorship_conversations_intern_id_fkey(id, full_name, cohort),
        mentor:users!mentorship_conversations_mentor_id_fkey(id, email)
      `)
      .single()

    if (convError) throw convError

    // Create initial message
    const { data: message, error: msgError } = await supabase
      .from('mentorship_messages')
      .insert([{
        conversation_id: conversation.id,
        sender_id: user.id,
        content: initial_message
      }])
      .select(`
        *,
        sender:users!mentorship_messages_sender_id_fkey(id, email)
      `)
      .single()

    if (msgError) throw msgError

    // Send notification to mentor
    await createNotification({
      userId: mentor_id,
      type: 'mentorship_request',
      message: `${profile.full_name} needs help with: ${subject}`
    })

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'create_mentorship_conversation',
      entityType: 'mentorship_conversation',
      entityId: conversation.id,
      metadata: {
        mentor_id,
        subject,
        category,
        priority
      }
    })

    return NextResponse.json({
      conversation,
      message
    })

  } catch (error) {
    console.error('Error creating mentorship conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}