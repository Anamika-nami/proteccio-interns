import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('app_config').select('key, value')
    const config: Record<string, string> = {}
    ;(data || []).forEach(row => { config[row.key] = row.value })
    return NextResponse.json(config)
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { key, value } = await request.json()
    if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 })

    const { error } = await supabase
      .from('app_config')
      .update({ value, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq('key', key)

    if (error) throw error

    try {
      await supabase.from('activity_logs').insert([{
        user_id: user.id, action: `Config updated: ${key} = ${value}`,
        entity_type: 'app_config', entity_id: key,
        metadata: { key, value }, log_category: 'config_change'
      }])
    } catch {}

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}
