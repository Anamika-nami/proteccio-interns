import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CompletionService } from '@/services/completionService'
import { getUserRole } from '@/lib/permissions'
import { z } from 'zod'

const completionSchema = z.object({
  intern_id: z.string().uuid(),
  action: z.enum(['complete', 'extend', 'terminate']),
  reason: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const role = await getUserRole(user.id)
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = completionSchema.parse(body)

    let result

    switch (validatedData.action) {
      case 'complete':
        result = await CompletionService.completeInternship(validatedData.intern_id, user.id)
        break
      case 'extend':
        result = await CompletionService.extendInternship(
          validatedData.intern_id,
          user.id,
          validatedData.reason || 'Extended by admin'
        )
        break
      case 'terminate':
        result = await CompletionService.terminateInternship(
          validatedData.intern_id,
          user.id,
          validatedData.reason || 'Terminated by admin'
        )
        break
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/completion:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
