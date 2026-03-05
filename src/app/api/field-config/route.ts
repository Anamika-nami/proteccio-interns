import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_ORG = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('field_config').select('*').eq('org_id', DEFAULT_ORG).order('sort_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const updates = await req.json()
    const results = await Promise.all(
      updates.map((u: any) =>
        supabase.from('field_config')
          .update({ is_enabled: u.is_enabled, is_required: u.is_required, classification: u.classification, sort_order: u.sort_order })
          .eq('org_id', DEFAULT_ORG).eq('field_name', u.field_name)
      )
    )
    const errors = results.filter(r => r.error)
    if (errors.length > 0) return NextResponse.json({ error: 'Some updates failed' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
