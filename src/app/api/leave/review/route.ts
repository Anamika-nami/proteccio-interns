import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { leaveReviewSchema } from '@/lib/validations'
import { logActivity } from '@/lib/logger'
import { getUserRole } from '@/lib/permissions'
import { createNotification } from '@/modules/notifications/notificationsService'

/**
 * PATCH /api/leave/review
 * 
 * Reviews a leave request (admin only).
 * 
 * Actions:
 * - Approve: Marks request as approved and creates attendance records
 * - Reject: Marks request as rejected with admin comment
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getUserRole(user.id)
    
    // Admin-only access
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const result = leaveReviewSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        fields: result.error.flatten().fieldErrors 
      }, { status: 400 })
    }

    const { leave_request_id, status, admin_comment } = result.data

    // Get leave request with intern info
    const { data: leaveRequest } = await supabase
      .from('leave_requests')
      .select('*, intern_profiles!inner(user_id)')
      .eq('id', leave_request_id)
      .single()

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
    }

    if (leaveRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Leave request already reviewed' }, { status: 400 })
    }

    // Update leave request
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status,
        admin_comment,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', leave_request_id)
      .select()
      .single()

    if (error) throw error

    // If approved, create attendance records for leave period
    if (status === 'approved') {
      const startDate = new Date(leaveRequest.start_date)
      const endDate = new Date(leaveRequest.end_date)
      const attendanceRecords = []

      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayOfWeek = date.getDay()
        
        // Skip weekends (0 = Sunday, 6 = Saturday) - configurable
        if (dayOfWeek === 0 || dayOfWeek === 6) continue

        attendanceRecords.push({
          intern_id: leaveRequest.intern_id,
          date: date.toISOString().split('T')[0],
          status: 'leave',
          marked_by_admin: true,
          admin_notes: `Leave approved: ${leaveRequest.reason}`
        })
      }

      if (attendanceRecords.length > 0) {
        await supabase
          .from('attendance')
          .upsert(attendanceRecords, {
            onConflict: 'intern_id,date'
          })
      }
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: `Leave request ${status}`,
      entityType: 'leave_request',
      entityId: data.id,
      metadata: { status, admin_comment, start_date: leaveRequest.start_date, end_date: leaveRequest.end_date }
    })

    // Notify intern
    if (leaveRequest.intern_profiles.user_id) {
      await createNotification({
        userId: leaveRequest.intern_profiles.user_id,
        type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
        message: status === 'approved' 
          ? 'Your leave request has been approved' 
          : 'Your leave request has been rejected',
        link: '/intern/leave'
      })
    }

    return NextResponse.json({
      success: true,
      data,
      message: `Leave request ${status === 'approved' ? 'approved' : 'rejected'} successfully`
    }, { status: 200 })

  } catch (error) {
    console.error('Leave review error:', error)
    return NextResponse.json({ error: 'Failed to review leave request' }, { status: 500 })
  }
}