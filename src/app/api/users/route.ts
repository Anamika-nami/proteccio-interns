import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserRole } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('users')
      .select(`
        id, 
        email, 
        role,
        intern_profile:intern_profiles(full_name)
      `)
      .limit(limit)

    // Filter by roles if specified
    if (roleFilter) {
      const roles = roleFilter.split(',').map(r => r.trim())
      query = query.in('role', roles)
    }

    // Search by email if specified
    if (search) {
      query = query.ilike('email', `%${search}%`)
    }

    const { data: users, error } = await query

    if (error) throw error

    // Transform data to include display names
    const transformedUsers = users?.map((user: any) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.intern_profile?.[0]?.full_name || user.email.split('@')[0]
    })) || []

    return NextResponse.json({ 
      users: transformedUsers,
      total: transformedUsers.length 
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}