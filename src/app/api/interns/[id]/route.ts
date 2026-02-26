import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logActivity } from '@/lib/logger'
import { runWorkflow } from '@/modules/workflow/workflowEngine'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    // Fetch current record to run workflow checks
    const { data: record } = await supabase
      .from('intern_profiles')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (action === 'delete') {
      const { error } = await supabase
        .from('intern_profiles')
        .update({ deleted_at: new Date().toISOString(), deleted_by: user.id, is_active: false })
        .eq('id', params.id)
      if (error) throw error
      await logActivity({ userId: user.id, action: 'Intern soft deleted', entityType: 'intern_profile', entityId: params.id, metadata: {} })
      return NextResponse.json({ success: true })
    }

    if (action === 'restore') {
      const { error } = await supabase
        .from('intern_profiles')
        .update({ deleted_at: null, deleted_by: null, is_active: true })
        .eq('id', params.id)
      if (error) throw error
      await logActivity({ userId: user.id, action: 'Intern restored', entityType: 'intern_profile', entityId: params.id, metadata: {} })
      return NextResponse.json({ success: true })
    }

    // For any other update — run workflow first
    const updatedRecord = { ...record, ...body }
    const workflow = await runWorkflow('intern_profile', updatedRecord)
    if (workflow.blocked) {
      return NextResponse.json({ error: workflow.message }, { status: 403 })
    }

    const { id: _id, action: _action, ...updates } = body
    const { error } = await supabase.from('intern_profiles').update(updates).eq('id', params.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
