import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('intern_tasks').select('*').eq('intern_id', id)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    if (!body.title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    const { data, error } = await supabase.from('intern_tasks').insert({
      intern_id: id, assigned_by: user.id,
      title: body.title, description: body.description || null,
      priority: body.priority || 'medium', due_date: body.due_date || null,
      is_recurring: body.is_recurring || false,
      recurrence_pattern: body.recurrence_pattern || null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { task_id, status, ...rest } = await req.json()
    const update: any = { ...rest }
    if (status) {
      update.status = status
      if (status === 'completed') update.completed_at = new Date().toISOString()
      if (status === 'reviewed') update.reviewed_at = new Date().toISOString()
    }

    const { data, error } = await supabase.from('intern_tasks')
      .update(update).eq('id', task_id).eq('intern_id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
