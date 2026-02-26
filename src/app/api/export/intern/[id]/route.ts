import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/permissions'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const role = await getUserRole(user.id)
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'

    // Intern can only export own profile
    if (role !== 'admin') {
      const { data: ownProfile } = await supabase
        .from('intern_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!ownProfile || ownProfile.id !== params.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const fields = role === 'admin'
      ? 'id, full_name, bio, skills, cohort, approval_status, is_active, created_at'
      : 'id, full_name, bio, skills, cohort'

    const { data, error } = await supabase
      .from('intern_profiles')
      .select(fields)
      .eq('id', params.id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (format === 'csv') {
      const headers = Object.keys(data).join(',')
      const values = Object.values(data).map(v =>
        Array.isArray(v) ? `"${v.join(';')}"` : `"${v ?? ''}"`
      ).join(',')
      return new Response(`${headers}\n${values}`, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="intern_${params.id}.csv"`
        }
      })
    }

    return new Response(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="intern_${params.id}.json"`
      }
    })
  } catch {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
