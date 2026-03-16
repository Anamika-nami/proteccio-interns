import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CertificateService } from '@/services/certificateService'

interface RouteContext {
  params: Promise<{ internId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { internId } = await context.params
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin or the intern themselves
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = userData?.role === 'admin'

    if (!isAdmin) {
      // Check if user is the intern
      const { data: intern } = await supabase
        .from('intern_profiles')
        .select('user_id')
        .eq('id', internId)
        .single()

      if (!intern || intern.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Generate certificate data
    const result = await CertificateService.generateCertificateData(internId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/certificates/[internId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
