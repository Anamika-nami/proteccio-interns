import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/permissions'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const role = await getUserRole(user.id)
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    if (role !== 'admin') {
      const { data: ownProfile } = await supabase
        .from('intern_profiles').select('id').eq('user_id', user.id).single()
      if (!ownProfile || ownProfile.id !== id) return new Response('Forbidden', { status: 403 })
    }

    const fields = role === 'admin'
      ? 'id, full_name, bio, skills, cohort, approval_status, is_active, created_at'
      : 'id, full_name, bio, skills, cohort'

    const { data, error } = await supabase
      .from('intern_profiles').select(fields).eq('id', id).single()

    if (error || !data) return new Response('Not found', { status: 404 })

    try {
      await supabase.from('activity_logs').insert([{
        user_id: user.id, action: `Exported intern profile ${id}`,
        entity_type: 'intern_profile', entity_id: id,
        metadata: { format }, log_category: 'data_export'
      }])
    } catch {}

    if (format === 'csv') {
      const headers = Object.keys(data).join(',')
      const values = Object.values(data).map(v =>
        Array.isArray(v) ? `"${(v as string[]).join(';')}"` : `"${v ?? ''}"`
      ).join(',')
      return new Response(`${headers}\n${values}`, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="intern_${id}.csv"`
        }
      })
    }

    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="intern_${id}.json"`
      }
    })
  } catch {
    return new Response('Export failed', { status: 500 })
  }
}
