import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .order('key')

    if (error) throw error

    // Convert to key-value object for easy consumption
    const config: Record<string, string> = {}
    data.forEach(item => { config[item.key] = item.value })

    return NextResponse.json(config, {
      headers: { 'Cache-Control': 'public, s-maxage=60' }
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { key, value } = await request.json()
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('app_config')
      .update({ value, updated_by: user.id, updated_at: new Date().toISOString() })
      .eq('key', key)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}
