import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { progressUpdateSchema } from '@/lib/validations'
import { logActivity } from '@/lib/logger'
import { getUserRole } from '@/lib/permissions'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { resourceId } = await params
    const body = await request.json()
    const validatedData = progressUpdateSchema.parse(body)

    // Verify resource exists
    const { data: resource } = await supabase
      .from('knowledge_resources')
      .select('id, title')
      .eq('id', resourceId)
      .single()

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Check if progress record exists
    const { data: existingProgress } = await supabase
      .from('knowledge_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
      .single()

    let progress
    if (existingProgress) {
      // Update existing progress
      const updateData: any = {
        status: validatedData.status,
        progress_percentage: validatedData.progress_percentage,
        time_spent_minutes: validatedData.time_spent_minutes,
        updated_at: new Date().toISOString()
      }

      if (validatedData.status === 'completed' && validatedData.progress_percentage === 100) {
        updateData.completed_at = new Date().toISOString()
      }

      const { data: updatedProgress, error } = await supabase
        .from('knowledge_progress')
        .update(updateData)
        .eq('id', existingProgress.id)
        .select()
        .single()

      if (error) throw error
      progress = updatedProgress
    } else {
      // Create new progress record
      const insertData: any = {
        user_id: user.id,
        resource_id: resourceId,
        status: validatedData.status,
        progress_percentage: validatedData.progress_percentage,
        time_spent_minutes: validatedData.time_spent_minutes
      }

      if (validatedData.status === 'completed' && validatedData.progress_percentage === 100) {
        insertData.completed_at = new Date().toISOString()
      }

      const { data: newProgress, error } = await supabase
        .from('knowledge_progress')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error
      progress = newProgress
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'update_knowledge_progress',
      entityType: 'knowledge_progress',
      entityId: progress.id,
      metadata: {
        resource_id: resourceId,
        resource_title: resource.title,
        status: validatedData.status,
        progress_percentage: validatedData.progress_percentage,
        time_spent_minutes: validatedData.time_spent_minutes
      }
    })

    return NextResponse.json({ progress })

  } catch (error) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { resourceId } = await params

    // Get user's progress for this resource
    const { data: progress, error } = await supabase
      .from('knowledge_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return NextResponse.json({ 
      progress: progress || null 
    })

  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}