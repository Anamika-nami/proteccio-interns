import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkFeature, getUserRole } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const enabled = await checkFeature('feature_tasks')
    if (!enabled) return NextResponse.json({ error: 'Tasks module is disabled' }, { status: 403 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = await getUserRole(user.id)
    const { searchParams } = new URL(request.url)
    const assignedTo = searchParams.get('assigned_to')

    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false })

    if (role !== 'admin') {
      const { data: profile } = await supabase
        .from('intern_profiles').select('id').eq('user_id', user.id).single()
      if (!profile) return NextResponse.json([], )
      query = query.eq('assigned_to', profile.id)
    } else if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = await getUserRole(user.id)
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    if (!body.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...body, created_by: user.id }])
      .select()
    if (error) throw error
    return NextResponse.json(data[0], { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { error } = await supabase.from('tasks').update(updates).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
