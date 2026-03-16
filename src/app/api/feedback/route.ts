import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FeedbackService } from '@/services/feedbackService'
import { z } from 'zod'

const feedbackSchema = z.object({
  intern_id: z.string().uuid(),
  learning_experience_rating: z.number().min(1).max(5),
  task_difficulty_rating: z.number().min(1).max(5),
  mentorship_rating: z.number().min(1).max(5),
  program_structure_rating: z.number().min(1).max(5),
  suggestions: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = feedbackSchema.parse(body)

    // Verify intern owns this profile
    const { data: intern } = await supabase
      .from('intern_profiles')
      .select('id')
      .eq('id', validatedData.intern_id)
      .eq('user_id', user.id)
      .single()

    if (!intern) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Submit feedback
    const result = await FeedbackService.submitFeedback(user.id, validatedData)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.feedback, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/feedback:', error)
    
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
