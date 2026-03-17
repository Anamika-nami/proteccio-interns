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
    const internId = searchParams.get('intern_id')
    const verificationStatus = searchParams.get('verification_status')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const from = (page - 1) * limit
    const to = from + limit - 1

    const role = await getUserRole(user.id)

    // Build query
    let query = supabase
      .from('learning_logs')
      .select(`
        *,
        intern:intern_profiles!learning_logs_intern_id_fkey(id, full_name, cohort),
        verified_by_user:users!learning_logs_verified_by_fkey(id, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    // Access control
    if (role === 'intern') {
      // Interns can only see their own logs
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
      // Admins can see all logs, optionally filtered by intern
      if (internId) {
        query = query.eq('intern_id', internId)
      }
    } else {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Apply filters
    if (verificationStatus) query = query.eq('verification_status', verificationStatus)
    if (category) query = query.eq('category', category)

    const { data: logs, error, count } = await query

    if (error) throw error

    // Get unique categories for filtering
    const { data: categoriesData } = await supabase
      .from('learning_logs')
      .select('category')
      .not('category', 'is', null)

    const categories = [...new Set(categoriesData?.map(r => r.category) || [])]

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      categories
    })

  } catch (error) {
    console.error('Error fetching learning logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learning logs' },
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
    
    // Only interns can create learning logs
    if (role !== 'intern') {
      return NextResponse.json({ error: 'Only interns can create learning logs' }, { status: 403 })
    }

    const body = await request.json()
    const {
      topic,
      description,
      category,
      tools_used = [],
      time_spent_hours,
      evidence_url
    } = body

    // Validation
    if (!topic || !description || !category || !time_spent_hours) {
      return NextResponse.json(
        { error: 'topic, description, category, and time_spent_hours are required' },
        { status: 400 }
      )
    }

    if (time_spent_hours <= 0 || time_spent_hours > 24) {
      return NextResponse.json(
        { error: 'time_spent_hours must be between 0 and 24' },
        { status: 400 }
      )
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

    // Create learning log
    const { data: log, error } = await supabase
      .from('learning_logs')
      .insert([{
        intern_id: profile.id,
        topic,
        description,
        category,
        tools_used,
        time_spent_hours,
        evidence_url
      }])
      .select(`
        *,
        intern:intern_profiles!learning_logs_intern_id_fkey(id, full_name, cohort)
      `)
      .single()

    if (error) throw error

    // Notify admins about new learning log for verification
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')

    for (const admin of (admins || [])) {
      await createNotification({
        userId: admin.id,
        type: 'learning_verification',
        message: `${profile.full_name} logged learning: ${topic}`
      })
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'create_learning_log',
      entityType: 'learning_log',
      entityId: log.id,
      metadata: {
        topic,
        category,
        time_spent_hours,
        tools_count: tools_used.length
      }
    })

    return NextResponse.json({ log })

  } catch (error) {
    console.error('Error creating learning log:', error)
    return NextResponse.json(
      { error: 'Failed to create learning log' },
      { status: 500 }
    )
  }
}