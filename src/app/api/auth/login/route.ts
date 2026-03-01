import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    try {
      const userId: string = data.user?.id ?? 'unknown'
      await supabase.from('activity_logs').insert([{
        user_id: userId,
        action: 'User logged in',
        entity_type: 'auth',
        entity_id: userId,
        metadata: { email },
        log_category: 'action'
      }])
    } catch {}

    return NextResponse.json({ success: true, user: data.user })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
