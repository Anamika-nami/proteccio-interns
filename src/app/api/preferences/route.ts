import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ theme: 'dark', layout: 'grid' })

    const { data } = await supabase
      .from('user_preferences')
      .select('theme, layout')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json(data || { theme: 'dark', layout: 'grid' })
  } catch {
    return NextResponse.json({ theme: 'dark', layout: 'grid' })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const { error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id, ...body, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
