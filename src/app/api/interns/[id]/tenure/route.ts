import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { action, ...data } = body

    let update: any = {}

    if (action === 'set') {
      if (!data.tenure_start || !data.tenure_end) {
        return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 })
      }
      if (new Date(data.tenure_end) <= new Date(data.tenure_start)) {
        return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
      }
      update = { tenure_start: data.tenure_start, tenure_end: data.tenure_end, tenure_status: 'active', grace_period_days: data.grace_period_days || 7 }
    }

    if (action === 'extend') {
      if (!data.new_end_date) return NextResponse.json({ error: 'New end date required' }, { status: 400 })
      update = { tenure_end: data.new_end_date, tenure_extended_until: data.new_end_date, tenure_status: 'extended' }
    }

    if (action === 'complete') {
      update = { tenure_status: 'completed', lifecycle_status: 'inactive', is_active: false }
    }

    if (action === 'terminate') {
      update = { tenure_status: 'terminated', lifecycle_status: 'inactive', is_active: false }
    }

    // Auto-check expiry
    if (action === 'check_expiry') {
      const { data: intern } = await supabase.from('intern_profiles')
        .select('tenure_end, tenure_status, grace_period_days').eq('id', id).single()
      if (intern && intern.tenure_end && intern.tenure_status === 'active') {
        const now = new Date()
        const endDate = new Date(intern.tenure_end)
        const graceDays = intern.grace_period_days || 7
        const graceEnd = new Date(endDate.getTime() + graceDays * 86400000)
        if (now > graceEnd) {
          update = { tenure_status: 'completed', lifecycle_status: 'inactive', is_active: false }
        }
      }
    }

    if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    const { data: updated, error } = await supabase.from('intern_profiles')
      .update(update).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
