import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { attendanceAdminUpdateSchema } from '@/lib/validations'
import { logActivity } from '@/lib/logger'
import { getUserRole } from '@/lib/permissions'

/**
 * PATCH /api/attendance/admin-update
 * 
 * Allows admins to manually update attendance records.
 * 
 * Use Cases:
 * - Correct mistakes
 * - Mark attendance for interns who forgot to check in
 * - Override system-generated status
 * 
 * Security:
 * - Admin-only access
 * - All changes are logged for audit trail
 * - marked_by_admin flag is set to true
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
    const result = attendanceAdminUpdateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        fields: result.error.flatten().fieldErrors 
      }, { status: 400 })
    }

    const { attendance_id, status, admin_notes, check_in_time, check_out_time } = result.data

    // Get existing record for audit log
    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('id', attendance_id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // Build update object
    const updates: any = {
      status,
      marked_by_admin: true,
      updated_at: new Date().toISOString()
    }

    if (admin_notes !== undefined) {
      updates.admin_notes = admin_notes
    }
    if (check_in_time !== undefined) {
      updates.check_in_time = check_in_time
    }
    if (check_out_time !== undefined) {
      updates.check_out_time = check_out_time
    }

    // Update attendance record
    const { data, error } = await supabase
      .from('attendance')
      .update(updates)
      .eq('id', attendance_id)
      .select()
      .single()

    if (error) throw error

    // Log activity for audit trail
    await logActivity({
      userId: user.id,
      action: 'Attendance manually updated by admin',
      entityType: 'attendance',
      entityId: data.id,
      category: 'config_change',
      metadata: { 
        old_status: existing.status,
        new_status: status,
        admin_notes,
        date: data.date
      }
    })

    return NextResponse.json({
      success: true,
      data,
      message: 'Attendance updated successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('Admin update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update attendance' 
    }, { status: 500 })
  }
}
