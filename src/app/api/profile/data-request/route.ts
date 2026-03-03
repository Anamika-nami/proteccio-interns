import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { request_type } = await req.json()
    if (!['export', 'deletion'].includes(request_type)) {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
    }

    const { data, error } = await supabase.from('data_requests')
      .insert({ user_id: user.id, request_type, status: 'pending' })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    try {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: `Data ${request_type} request submitted`,
        log_category: 'privacy',
      })
    } catch {}

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
