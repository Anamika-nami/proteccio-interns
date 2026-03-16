import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ReportService } from '@/services/reportService'

interface RouteContext {
  params: Promise<{ internId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { internId } = await context.params
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Export report
    const result = await ReportService.exportReportData(internId, user.id)

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Return as JSON file
    return new NextResponse(JSON.stringify(result.data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="intern_report_${internId}.json"`
      }
    })
  } catch (error) {
    console.error('Error in POST /api/reports/[internId]/export:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
