import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { attendanceCheckInSchema } from '@/lib/validations'
import { logActivity } from '@/lib/logger'
import { getUserRole } from '@/lib/permissions'

/**
 * POST /api/attendance/checkin
 * 
 * Allows an intern to check in for the day.
 * 
 * Business Rules:
 * - Check-in allowed only once per day
 * - Timestamp is server-generated (prevents manipulation)
 * - Automatically sets status to 'present'
 * - Interns can only check in for themselves
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
    const result = attendanceCheckInSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        fields: result.error.flatten().fieldErrors 
      }, { status: 400 })
    }

    const { intern_id, date } = result.data

    // Security: Interns can only check in for themselves
    if (role !== 'admin') {
      const { data: profile } = await supabase
        .from('intern_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!profile || profile.id !== intern_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Check if already checked in today
    const { data: existing } = await supabase
      .from('attendance')
      .select('id, check_in_time')
      .eq('intern_id', intern_id)
      .eq('date', date)
      .single()

    if (existing && existing.check_in_time) {
      return NextResponse.json({ 
        error: 'Already checked in today',
        check_in_time: existing.check_in_time
      }, { status: 400 })
    }

    // Server-generated timestamp (critical for security)
    const checkInTime = new Date().toISOString()

    // Insert or update attendance record
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        intern_id,
        date,
        check_in_time: checkInTime,
        status: 'present',
        marked_by_admin: false
      }, {
        onConflict: 'intern_id,date'
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'Check-in recorded',
      entityType: 'attendance',
      entityId: data.id,
      metadata: { date, check_in_time: checkInTime }
    })

    return NextResponse.json({
      success: true,
      data,
      message: 'Checked in successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ 
      error: 'Failed to check in' 
    }, { status: 500 })
  }
}
