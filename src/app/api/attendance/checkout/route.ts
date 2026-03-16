import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { attendanceCheckOutSchema } from '@/lib/validations'
import { logActivity } from '@/lib/logger'
import { getUserRole } from '@/lib/permissions'

/**
 * POST /api/attendance/checkout
 * 
 * Allows an intern to check out for the day.
 * 
 * Business Rules:
 * - Check-out must occur after check-in
 * - Timestamp is server-generated (prevents manipulation)
 * - Automatically calculates working hours
 * - Auto-determines half-day status based on hours worked
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = await getUserRole(user.id)
    const body = await request.json()
    
    // Validate input
    const result = attendanceCheckOutSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        fields: result.error.flatten().fieldErrors 
      }, { status: 400 })
    }

    const { attendance_id } = result.data

    // Get attendance record
    const { data: attendance, error: fetchError } = await supabase
      .from('attendance')
      .select('*, intern_profiles!inner(user_id)')
      .eq('id', attendance_id)
      .single()

    if (fetchError || !attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    // Security: Interns can only check out for themselves
    if (role !== 'admin') {
      if (attendance.intern_profiles.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Validate check-in exists
    if (!attendance.check_in_time) {
      return NextResponse.json({ 
        error: 'Cannot check out without checking in first' 
      }, { status: 400 })
    }

    // Validate not already checked out
    if (attendance.check_out_time) {
      return NextResponse.json({ 
        error: 'Already checked out',
        check_out_time: attendance.check_out_time
      }, { status: 400 })
    }

    // Server-generated timestamp (critical for security)
    const checkOutTime = new Date().toISOString()

    // Update attendance record (trigger will calculate hours and status)
    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out_time: checkOutTime
      })
      .eq('id', attendance_id)
      .select()
      .single()

    if (error) throw error

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'Check-out recorded',
      entityType: 'attendance',
      entityId: data.id,
      metadata: { 
        date: data.date, 
        check_out_time: checkOutTime,
        working_hours: data.working_hours
      }
    })

    return NextResponse.json({
      success: true,
      data,
      message: `Checked out successfully. Worked ${data.working_hours?.toFixed(2)} hours`
    }, { status: 200 })

  } catch (error) {
    console.error('Check-out error:', error)
    return NextResponse.json({ 
      error: 'Failed to check out' 
    }, { status: 500 })
  }
}
