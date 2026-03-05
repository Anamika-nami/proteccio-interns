import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { canTransition } from '@/lib/internWorkflow'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action, ids } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const actionMap: Record<string, { lifecycle_status: string; approval_status?: string; is_active?: boolean }> = {
      approve:    { lifecycle_status: 'approved', approval_status: 'active', is_active: true },
      activate:   { lifecycle_status: 'active', is_active: true },
      deactivate: { lifecycle_status: 'inactive', is_active: false },
      archive:    { lifecycle_status: 'archived', is_active: false },
    }

    const update = actionMap[action]
    if (!update) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    // Fetch current statuses to validate transitions
    const { data: interns } = await supabase
      .from('intern_profiles').select('id, lifecycle_status').in('id', ids)

    const validIds = (interns || [])
      .filter(i => canTransition(i.lifecycle_status, update.lifecycle_status))
      .map(i => i.id)

    if (validIds.length === 0) {
      return NextResponse.json({ error: 'No valid transitions for selected interns' }, { status: 400 })
    }

    const { error } = await supabase.from('intern_profiles')
      .update({ ...update, status_changed_by: user.id, status_changed_at: new Date().toISOString() })
      .in('id', validIds)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Audit log
    await supabase.from('intern_audit_log').insert(
      validIds.map(id => ({
        intern_id: id,
        changed_by: user.id,
        event_type: 'status_change',
        new_value: update.lifecycle_status,
      }))
    )

    return NextResponse.json({ updated: validIds.length, skipped: ids.length - validIds.length })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
