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
      .from('consent_logs')
      .select('id, user_id, consented_at, version')
      .order('consented_at', { ascending: false })

    const rows = (data || []).map(r =>
      `"${r.id}","${r.user_id}","${r.consented_at}","${r.version}"`
    )
    const csv = `id,user_id,consented_at,version\n${rows.join('\n')}`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="consent_logs.csv"'
      }
    })
  } catch {
    return new Response('Export failed', { status: 500 })
  }
}
