import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const form = searchParams.get('form') || 'intern_profile'
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_name', form)
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to load form fields' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.field_key || !body.field_label || !body.field_type) {
      return NextResponse.json({ error: 'field_key, field_label and field_type are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('form_fields')
      .insert([{ ...body, form_name: body.form_name || 'intern_profile' }])
      .select()

    if (error) throw error
    return NextResponse.json(data[0], { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create field' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body

    const { error } = await supabase
      .from('form_fields')
      .update(updates)
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update field' }, { status: 500 })
  }
}
