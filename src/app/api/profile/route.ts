import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [profileRes, privacyRes, notifRes, prefRes, requestsRes, logsRes] = await Promise.all([
      supabase.from('users').select('id, email, role, display_name, phone, bio, avatar_url, last_login, last_login_ip, created_at').eq('id', user.id).single(),
      supabase.from('privacy_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('data_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('activity_logs').select('action, created_at, log_category').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ])

    return NextResponse.json({
      profile: profileRes.data,
      privacy: privacyRes.data,
      notifications: notifRes.data,
      preferences: prefRes.data,
      dataRequests: requestsRes.data || [],
      activityLogs: logsRes.data || [],
    })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { section, ...data } = body

    if (section === 'profile') {
      const allowed = ['display_name', 'phone', 'bio', 'avatar_url']
      const safe = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)))
      const { error } = await supabase.from('users').update(safe).eq('id', user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (section === 'privacy') {
      const { error } = await supabase.from('privacy_preferences')
        .upsert({ user_id: user.id, ...data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (section === 'notifications') {
      const { error } = await supabase.from('notification_preferences')
        .upsert({ user_id: user.id, ...data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (section === 'preferences') {
      const { error } = await supabase.from('user_preferences')
        .upsert({ user_id: user.id, ...data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
