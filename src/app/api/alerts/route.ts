import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const DEFAULT_ORG = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const alerts: any[] = []
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 86400000)

    // 1. Tenure expiring soon
    const { data: expiringTenure } = await supabase.from('intern_profiles')
      .select('id, full_name, tenure_end')
      .eq('tenure_status', 'active').eq('is_active', true).is('deleted_at', null)
      .gte('tenure_end', now.toISOString().split('T')[0])
      .lte('tenure_end', in7Days.toISOString().split('T')[0])

    for (const intern of expiringTenure || []) {
      alerts.push({ type: 'tenure_expiring', intern_id: intern.id, intern_name: intern.full_name,
        message: `Tenure for ${intern.full_name} expires on ${intern.tenure_end}`, severity: 'warning' })
    }

    // 2. Overdue tasks
    const { data: overdueTasks } = await supabase.from('intern_tasks')
      .select('intern_id, title, due_date, intern_profiles(full_name)')
      .in('status', ['pending', 'in_progress'])
      .lt('due_date', now.toISOString().split('T')[0])
      .not('due_date', 'is', null)
      .limit(20)

    for (const task of overdueTasks || []) {
      const name = (task.intern_profiles as any)?.full_name || 'Unknown'
      alerts.push({ type: 'overdue_task', intern_id: task.intern_id, intern_name: name,
        message: `Task "${task.title}" overdue for ${name}`, severity: 'warning' })
    }

    // 3. Pending document verification
    const { data: pendingDocs } = await supabase.from('intern_documents')
      .select('intern_id, doc_type, intern_profiles(full_name)')
      .eq('verification_status', 'pending')
      .limit(20)

    for (const doc of pendingDocs || []) {
      const name = (doc.intern_profiles as any)?.full_name || 'Unknown'
      alerts.push({ type: 'pending_document', intern_id: doc.intern_id, intern_name: name,
        message: `Document "${doc.doc_type.replace('_', ' ')}" pending verification for ${name}`, severity: 'info' })
    }

    // 4. Low performance (rating < 5)
    const { data: lowPerf } = await supabase.from('intern_profiles')
      .select('id, full_name, performance_rating')
      .eq('is_active', true).is('deleted_at', null)
      .not('performance_rating', 'is', null)
      .lt('performance_rating', 5)

    for (const intern of lowPerf || []) {
      alerts.push({ type: 'low_performance', intern_id: intern.id, intern_name: intern.full_name,
        message: `${intern.full_name} has performance rating ${intern.performance_rating}/10`, severity: 'critical' })
    }

    return NextResponse.json(alerts)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
