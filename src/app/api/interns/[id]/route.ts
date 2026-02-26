import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { runWorkflow } from '@/modules/workflow/workflowEngine'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    const { data: record } = await supabase
      .from('intern_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (action === 'delete') {
      const { error } = await supabase
        .from('intern_profiles')
        .update({ deleted_at: new Date().toISOString(), deleted_by: user.id, is_active: false })
        .eq('id', id)
      if (error) throw error

      try {
        const supabaseLog = await createClient()
        await supabaseLog.from('activity_logs').insert([{
          user_id: user.id, action: 'Intern soft deleted',
          entity_type: 'intern_profile', entity_id: id, metadata: {}
        }])
      } catch {}

      return NextResponse.json({ success: true })
    }

    if (action === 'restore') {
      const { error } = await supabase
        .from('intern_profiles')
        .update({ deleted_at: null, deleted_by: null, is_active: true })
        .eq('id', id)
      if (error) throw error

      try {
        const supabaseLog = await createClient()
        await supabaseLog.from('activity_logs').insert([{
          user_id: user.id, action: 'Intern restored',
          entity_type: 'intern_profile', entity_id: id, metadata: {}
        }])
      } catch {}

      return NextResponse.json({ success: true })
    }

    // For any other update — run workflow first
    const updatedRecord = { ...record, ...body }
    const workflow = await runWorkflow('intern_profile', updatedRecord)
    if (workflow.blocked) {
      return NextResponse.json({ error: workflow.message }, { status: 403 })
    }

    const { action: _a, ...updates } = body
    const { error } = await supabase.from('intern_profiles').update(updates).eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
