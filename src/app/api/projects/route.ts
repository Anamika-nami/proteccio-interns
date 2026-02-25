import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkFeature } from '@/lib/permissions'

export async function GET() {
  try {
    const enabled = await checkFeature('feature_projects')
    if (!enabled) {
      return NextResponse.json({ error: 'Projects module is currently disabled' }, { status: 403 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, description, tech_stack, status, live_url, repo_url')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const enabled = await checkFeature('feature_projects')
    if (!enabled) {
      return NextResponse.json({ error: 'Projects module is currently disabled' }, { status: 403 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{ ...body, created_by: user.id }])
      .select()

    if (error) throw error
    return NextResponse.json(data[0], { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
