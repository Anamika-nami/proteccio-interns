import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { learningLogVerificationSchema } from '@/lib/validations'
import { logActivity } from '@/lib/logger'
import { getUserRole } from '@/lib/permissions'
import { createNotification } from '@/modules/notifications/notificationsService'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getUserRole(user.id)
    
    // Only admins can verify learning logs
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can verify learning logs' }, { status: 403 })
    }

    const { id } = await params
    const logId = id
    const body = await request.json()
    const validatedData = learningLogVerificationSchema.parse(body)

    // Get learning log details
    const { data: learningLog } = await supabase
      .from('learning_logs')
      .select(`
        *,
        intern:intern_profiles!learning_logs_intern_id_fkey(id, full_name, user_id)
      `)
      .eq('id', logId)
      .single()

    if (!learningLog) {
      return NextResponse.json({ error: 'Learning log not found' }, { status: 404 })
    }

    if (learningLog.verification_status !== 'pending') {
      return NextResponse.json({ error: 'Learning log has already been processed' }, { status: 400 })
    }

    // Update learning log
    const { data: updatedLog, error } = await supabase
      .from('learning_logs')
      .update({
        verification_status: validatedData.verification_status,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
        verification_notes: validatedData.verification_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', logId)
      .select(`
        *,
        intern:intern_profiles!learning_logs_intern_id_fkey(id, full_name, cohort),
        verified_by_user:users!learning_logs_verified_by_fkey(id, email)
      `)
      .single()

    if (error) throw error

    // Send notification to intern
    if (learningLog.intern?.user_id) {
      const notificationTitle = validatedData.verification_status === 'verified' 
        ? 'Learning log verified' 
        : 'Learning log needs revision'
      
      const notificationMessage = validatedData.verification_status === 'verified'
        ? `Your learning log "${learningLog.topic}" has been verified`
        : `Your learning log "${learningLog.topic}" needs revision`

      await createNotification({
        userId: learningLog.intern.user_id,
        type: 'learning_verification',
        message: notificationMessage
      })
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'verify_learning_log',
      entityType: 'learning_log',
      entityId: logId,
      metadata: {
        verification_status: validatedData.verification_status,
        intern_id: learningLog.intern_id,
        topic: learningLog.topic,
        time_spent_hours: learningLog.time_spent_hours,
        has_notes: !!validatedData.verification_notes
      }
    })

    return NextResponse.json({ log: updatedLog })

  } catch (error) {
    console.error('Error verifying learning log:', error)
    return NextResponse.json(
      { error: 'Failed to verify learning log' },
      { status: 500 }
    )
  }
}