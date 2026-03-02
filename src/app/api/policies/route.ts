import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_ORG = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('policies').select('*').eq('org_id', DEFAULT_ORG).order('priority')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { data, error } = await supabase
      .from('policies').insert({ ...body, org_id: DEFAULT_ORG }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { id, ...updates } = body
    const { data, error } = await supabase
      .from('policies').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
