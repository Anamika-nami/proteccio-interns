import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logActivity } from '@/lib/logger'
import { getUserRole, checkPermission } from '@/lib/permissions'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build query
    let query = supabase
      .from('knowledge_resources')
      .select(`
        *,
        created_by_profile:users!knowledge_resources_created_by_fkey(id, email),
        user_bookmark:knowledge_bookmarks!left(id),
        user_progress:knowledge_progress!left(status, progress_percentage, completed_at)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    // Apply filters
    if (category) query = query.eq('category', category)
    if (difficulty) query = query.eq('difficulty_level', difficulty)
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags)
    }

    const { data: resources, error, count } = await query

    if (error) throw error

    // Get unique categories and tags for filters
    const { data: categoriesData } = await supabase
      .from('knowledge_resources')
      .select('category')
      .not('category', 'is', null)

    const { data: tagsData } = await supabase
      .from('knowledge_resources')
      .select('tags')
      .not('tags', 'is', null)

    const categories = [...new Set(categoriesData?.map(r => r.category) || [])]
    const allTags = [...new Set(tagsData?.flatMap(r => r.tags || []) || [])]

    // Transform resources with user-specific data
    const transformedResources = resources?.map(resource => ({
      ...resource,
      is_bookmarked: resource.user_bookmark?.length > 0,
      user_progress: resource.user_progress?.[0] || null
    })) || []

    return NextResponse.json({
      resources: transformedResources,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      categories,
      tags: allTags
    })

  } catch (error) {
    console.error('Error fetching knowledge resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getUserRole(user.id)
    const canCreate = await checkPermission(role, 'knowledge_resources', 'can_create')
    
    if (!canCreate) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      content_type,
      file_url,
      external_url,
      category,
      tags = [],
      difficulty_level = 'beginner',
      estimated_duration_minutes,
      is_featured = false
    } = body

    // Validation
    if (!title || !content_type || !category) {
      return NextResponse.json(
        { error: 'title, content_type, and category are required' },
        { status: 400 }
      )
    }

    if (!['document', 'video', 'link', 'tutorial', 'reference'].includes(content_type)) {
      return NextResponse.json(
        { error: 'Invalid content_type' },
        { status: 400 }
      )
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(difficulty_level)) {
      return NextResponse.json(
        { error: 'Invalid difficulty_level' },
        { status: 400 }
      )
    }

    // Create resource
    const { data: resource, error } = await supabase
      .from('knowledge_resources')
      .insert([{
        title,
        description,
        content_type,
        file_url,
        external_url,
        category,
        tags,
        difficulty_level,
        estimated_duration_minutes,
        is_featured,
        created_by: user.id
      }])
      .select(`
        *,
        created_by_profile:users!knowledge_resources_created_by_fkey(id, email)
      `)
      .single()

    if (error) throw error

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'create_knowledge_resource',
      entityType: 'knowledge_resource',
      entityId: resource.id,
      metadata: {
        title,
        category,
        content_type,
        difficulty_level
      }
    })

    return NextResponse.json({ resource })

  } catch (error) {
    console.error('Error creating knowledge resource:', error)
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    )
  }
}