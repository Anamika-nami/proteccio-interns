import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/permissions'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const role = await getUserRole(user.id)
    if (role !== 'admin') return new Response('Forbidden', { status: 403 })

    const { data } = await supabase
      .from('intern_profiles')
      .select('id, full_name, cohort, skills, bio, approval_status, is_active, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    const headers = 'id,full_name,cohort,skills,bio,approval_status,is_active,created_at'
    const rows = (data || []).map(r =>
      `"${r.id}","${r.full_name}","${r.cohort}","${(r.skills || []).join(';')}","${r.bio || ''}","${r.approval_status}","${r.is_active}","${r.created_at}"`
    )
    const csv = `${headers}\n${rows.join('\n')}`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="all_interns.csv"'
      }
    })
  } catch {
    return new Response('Export failed', { status: 500 })
  }
}
