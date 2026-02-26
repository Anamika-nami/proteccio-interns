import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { internSchema } from '@/lib/validations'
import { logActivity } from '@/lib/logger'
import { checkFeature, getUserRole } from '@/lib/permissions'
import { runWorkflow } from '@/modules/workflow/workflowEngine'
import { createNotification } from '@/modules/notifications/notificationsService'

const PUBLIC_FIELDS = 'id, full_name, cohort, skills, bio'
const ADMIN_FIELDS = '*'

export async function GET(request: Request) {
  try {
    const enabled = await checkFeature('feature_interns')
    if (!enabled) return NextResponse.json({ error: 'Interns module is currently disabled' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'active'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '9')
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const role = user ? await getUserRole(user.id) : 'public'
    const fields = role === 'admin' ? ADMIN_FIELDS : PUBLIC_FIELDS

    let query = supabase
      .from('intern_profiles')
      .select(fields + ', count:id', { count: 'exact' })
      .eq('is_active', status === 'active')
      .is('deleted_at', null)
      .range(from, to)

    if (search) query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`)

    const { data, error, count } = await query.order('created_at', { ascending: false })
    if (error) throw error

    return NextResponse.json({ data, total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const enabled = await checkFeature('feature_interns')
    if (!enabled) return NextResponse.json({ error: 'Interns module is currently disabled' }, { status: 403 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = internSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', fields: result.error.flatten().fieldErrors }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('intern_profiles')
      .insert([result.data])
      .select()

    if (error) throw error

    // Run workflow on new profile
    const workflow = await runWorkflow('intern_profile', data[0])
    if (workflow.actions.includes('notify_incomplete') && body.user_id) {
      await createNotification({
        userId: body.user_id,
        type: 'profile_incomplete',
        message: 'Your profile is incomplete. Please add a bio and skills.',
        link: '/intern'
      })
    }

    await logActivity({
      userId: user.id,
      action: 'Intern profile created',
      entityType: 'intern_profile',
      entityId: data[0].id,
      metadata: { intern_name: result.data.full_name }
    })

    return NextResponse.json(data[0], { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
