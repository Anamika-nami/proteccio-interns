import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('intern_profiles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { full_name, bio, skills, avatar_url, linkedin_url, cohort, user_id } = body

    if (!full_name || !cohort || !user_id) {
      return NextResponse.json({ error: 'full_name, cohort and user_id are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('intern_profiles')
      .insert([{ full_name, bio, skills, avatar_url, linkedin_url, cohort, user_id }])
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
