import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_ORG = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('data_controls').select('*').eq('org_id', DEFAULT_ORG)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { control_key, control_value } = await req.json()
    const { data, error } = await supabase
      .from('data_controls')
      .upsert({ org_id: DEFAULT_ORG, control_key, control_value, updated_at: new Date().toISOString() },
               { onConflict: 'org_id,control_key' })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
