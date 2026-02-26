import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ consented: false })

    const { data } = await supabase
      .from('consent_logs')
      .select('id, consented_at, version')
      .eq('user_id', user.id)
      .eq('version', 'v1')
      .single()

    return NextResponse.json({ consented: !!data, record: data || null })
  } catch {
    return NextResponse.json({ consented: false })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { error } = await supabase
      .from('consent_logs')
      .insert([{ user_id: user.id, version: 'v1' }])

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to record consent' }, { status: 500 })
  }
}
