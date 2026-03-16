import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EvaluationService } from '@/services/evaluationService'
import { getUserRole } from '@/lib/permissions'
import { z } from 'zod'

const evaluationSchema = z.object({
  intern_id: z.string().uuid(),
  task_quality_score: z.number().min(1).max(5),
  consistency_score: z.number().min(1).max(5),
  attendance_score: z.number().min(1).max(5),
  communication_score: z.number().min(1).max(5),
  learning_score: z.number().min(1).max(5),
  feedback: z.string().optional()
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
    const validatedData = evaluationSchema.parse(body)

    // Submit evaluation
    const result = await EvaluationService.submitEvaluation(user.id, validatedData)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.evaluation, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/evaluations:', error)
    
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const internId = searchParams.get('intern_id')

    if (!internId) {
      return NextResponse.json({ error: 'intern_id is required' }, { status: 400 })
    }

    // Fetch evaluations
    const result = await EvaluationService.getInternEvaluations(internId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.evaluations)
  } catch (error) {
    console.error('Error in GET /api/evaluations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
