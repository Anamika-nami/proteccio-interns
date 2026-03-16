import { createClient } from '@/lib/supabase/server'
import type { InternEvaluation, CreateEvaluationDTO } from '@/types'
import { logActivity } from '@/lib/logger'

export class EvaluationService {
  /**
   * Calculate overall score from individual scores
   */
  static calculateOverallScore(scores: {
    task_quality_score: number
    consistency_score: number
    attendance_score: number
    communication_score: number
    learning_score: number
  }): number {
    const sum = 
      scores.task_quality_score +
      scores.consistency_score +
      scores.attendance_score +
      scores.communication_score +
      scores.learning_score
    
    return Math.round((sum / 5) * 100) / 100
  }

  /**
   * Submit evaluation for an intern
   */
  static async submitEvaluation(
    evaluatorId: string,
    data: CreateEvaluationDTO
  ): Promise<{ success: boolean; evaluation?: InternEvaluation; error?: string }> {
    try {
      const supabase = await createClient()

      // Validate scores
      const scores = [
        data.task_quality_score,
        data.consistency_score,
        data.attendance_score,
        data.communication_score,
        data.learning_score
      ]

      if (scores.some(score => score < 1 || score > 5)) {
        return { success: false, error: 'All scores must be between 1 and 5' }
      }

      // Calculate overall score
      const overall_score = this.calculateOverallScore(data)

      // Insert evaluation
      const { data: evaluation, error } = await supabase
        .from('intern_evaluations')
        .insert({
          intern_id: data.intern_id,
          evaluator_id: evaluatorId,
          task_quality_score: data.task_quality_score,
          consistency_score: data.consistency_score,
          attendance_score: data.attendance_score,
          communication_score: data.communication_score,
          learning_score: data.learning_score,
          overall_score,
          feedback: data.feedback || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error submitting evaluation:', error)
        return { success: false, error: error.message }
      }

      // Log activity
      await logActivity({
        userId: evaluatorId,
        action: 'evaluation_submitted',
        entityType: 'intern_evaluation',
        entityId: evaluation.id,
        metadata: {
          intern_id: data.intern_id,
          overall_score
        },
        category: 'action'
      })

      return { success: true, evaluation }
    } catch (error) {
      console.error('Error in submitEvaluation:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get all evaluations for an intern
   */
  static async getInternEvaluations(
    internId: string
  ): Promise<{ success: boolean; evaluations?: InternEvaluation[]; error?: string }> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('intern_evaluations')
        .select('*')
        .eq('intern_id', internId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching evaluations:', error)
        return { success: false, error: error.message }
      }

      return { success: true, evaluations: data || [] }
    } catch (error) {
      console.error('Error in getInternEvaluations:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get average evaluation score for an intern
   */
  static async getAverageScore(
    internId: string
  ): Promise<{ success: boolean; averageScore?: number; error?: string }> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('intern_evaluations')
        .select('overall_score')
        .eq('intern_id', internId)

      if (error) {
        return { success: false, error: error.message }
      }

      if (!data || data.length === 0) {
        return { success: true, averageScore: 0 }
      }

      const sum = data.reduce((acc, curr) => acc + curr.overall_score, 0)
      const averageScore = Math.round((sum / data.length) * 100) / 100

      return { success: true, averageScore }
    } catch (error) {
      console.error('Error in getAverageScore:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Check if intern has been evaluated
   */
  static async hasEvaluation(internId: string): Promise<boolean> {
    try {
      const supabase = await createClient()

      const { count, error } = await supabase
        .from('intern_evaluations')
        .select('*', { count: 'exact', head: true })
        .eq('intern_id', internId)

      if (error) {
        console.error('Error checking evaluation:', error)
        return false
      }

      return (count || 0) > 0
    } catch (error) {
      console.error('Error in hasEvaluation:', error)
      return false
    }
  }
}
