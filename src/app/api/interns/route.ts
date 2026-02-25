import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { internSchema } from '@/lib/validations'
import { logActivity } from '@/lib/logger'
import { checkFeature, getUserRole } from '@/lib/permissions'

// Public fields only — sensitive fields stripped for non-admin
const PUBLIC_FIELDS = 'id, full_name, cohort, skills, bio'
const ADMIN_FIELDS = '*'

export async function GET(request: Request) {
  try {
    // Check feature toggle
    const enabled = await checkFeature('feature_interns')
    if (!enabled) {
      return NextResponse.json({ error: 'Interns module is currently disabled' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'active'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '9')
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await createClient()

    // Check if requester is admin — admins get full fields
    const { data: { user } } = await supabase.auth.getUser()
    const role = user ? await getUserRole(user.id) : 'public'
    const fields = role === 'admin' ? ADMIN_FIELDS : PUBLIC_FIELDS

    let query = supabase
      .from('intern_profiles')
      .select(fields + ', count:id', { count: 'exact' })
      .eq('is_active', status === 'active')
      .range(from, to)

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    const { data, error, count } = await query.order('created_at', { ascending: false })
    if (error) throw error

    return NextResponse.json({
      data, total: count || 0, page, limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Check feature toggle
    const enabled = await checkFeature('feature_interns')
    if (!enabled) {
      return NextResponse.json({ error: 'Interns module is currently disabled' }, { status: 403 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = internSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', fields: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('intern_profiles')
      .insert([result.data])
      .select()

    if (error) throw error

    await logActivity({
      userId: user.id,
      action: 'Intern profile created',
      entityType: 'intern_profile',
      entityId: data[0].id,
      metadata: { intern_name: result.data.full_name, cohort: result.data.cohort }
    })

    return NextResponse.json(data[0], { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
