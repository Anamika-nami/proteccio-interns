import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logActivity } from '@/lib/logger'
import { getUserRole } from '@/lib/permissions'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { resource_id } = body

    if (!resource_id) {
      return NextResponse.json({ error: 'resource_id is required' }, { status: 400 })
    }

    // Verify resource exists
    const { data: resource } = await supabase
      .from('knowledge_resources')
      .select('id, title')
      .eq('id', resource_id)
      .single()

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Check if already bookmarked
    const { data: existingBookmark } = await supabase
      .from('knowledge_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('resource_id', resource_id)
      .single()

    if (existingBookmark) {
      // Remove bookmark
      const { error } = await supabase
        .from('knowledge_bookmarks')
        .delete()
        .eq('id', existingBookmark.id)

      if (error) throw error

      await logActivity({
        userId: user.id,
        action: 'remove_knowledge_bookmark',
        entityType: 'knowledge_bookmark',
        entityId: existingBookmark.id,
        metadata: { resource_id, resource_title: resource.title }
      })

      return NextResponse.json({ 
        bookmarked: false,
        message: 'Bookmark removed'
      })
    } else {
      // Add bookmark
      const { data: bookmark, error } = await supabase
        .from('knowledge_bookmarks')
        .insert([{
          user_id: user.id,
          resource_id
        }])
        .select()
        .single()

      if (error) throw error

      await logActivity({
        userId: user.id,
        action: 'create_knowledge_bookmark',
        entityType: 'knowledge_bookmark',
        entityId: bookmark.id,
        metadata: { resource_id, resource_title: resource.title }
      })

      return NextResponse.json({ 
        bookmark,
        bookmarked: true,
        message: 'Bookmark added'
      })
    }

  } catch (error) {
    console.error('Error managing bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to manage bookmark' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Get user's bookmarks with resource details
    const { data: bookmarks, error, count } = await supabase
      .from('knowledge_bookmarks')
      .select(`
        *,
        resource:knowledge_resources(*)
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({
      bookmarks: bookmarks || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    )
  }
}