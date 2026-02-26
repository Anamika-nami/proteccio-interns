import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logActivity } from '@/lib/logger'

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

    if (action === 'delete') {
      const { error } = await supabase
        .from('intern_profiles')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          is_active: false
        })
        .eq('id', params.id)

      if (error) throw error

      await logActivity({
        userId: user.id,
        action: 'Intern soft deleted',
        entityType: 'intern_profile',
        entityId: params.id,
        metadata: { deleted_by: user.id }
      })

      return NextResponse.json({ success: true })
    }

    if (action === 'restore') {
      const { error } = await supabase
        .from('intern_profiles')
        .update({
          deleted_at: null,
          deleted_by: null,
          is_active: true,
          restore_note: body.note || null
        })
        .eq('id', params.id)

      if (error) throw error

      await logActivity({
        userId: user.id,
        action: 'Intern restored',
        entityType: 'intern_profile',
        entityId: params.id,
        metadata: { restored_by: user.id }
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
