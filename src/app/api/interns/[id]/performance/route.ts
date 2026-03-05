import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [internRes, tasksRes, attendanceRes] = await Promise.all([
      supabase.from('intern_profiles').select('performance_rating, performance_remarks, certificate_eligible, tenure_start, tenure_end, tenure_status').eq('id', id).single(),
      supabase.from('intern_tasks').select('status').eq('intern_id', id),
      supabase.from('intern_attendance').select('status').eq('intern_id', id),
    ])

    const tasks = tasksRes.data || []
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t: any) => ['completed', 'reviewed'].includes(t.status)).length
    const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const attendance = attendanceRes.data || []
    const totalDays = attendance.length
    const presentDays = attendance.filter((a: any) => ['present', 'half_day'].includes(a.status)).length
    const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

    return NextResponse.json({
      ...internRes.data,
      task_completion_pct: completionPct,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      attendance_pct: attendancePct,
      total_days: totalDays,
      present_days: presentDays,
    })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { performance_rating, performance_remarks, certificate_eligible } = await req.json()
    const update: any = {}
    if (performance_rating !== undefined) {
      if (performance_rating < 0 || performance_rating > 10) {
        return NextResponse.json({ error: 'Rating must be 0-10' }, { status: 400 })
      }
      update.performance_rating = performance_rating
    }
    if (performance_remarks !== undefined) update.performance_remarks = performance_remarks
    if (certificate_eligible !== undefined) update.certificate_eligible = certificate_eligible

    const { data, error } = await supabase.from('intern_profiles').update(update).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
