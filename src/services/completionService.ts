import { createClient } from '@/lib/supabase/server'
import type { InternStatus, CompletionReviewIntern } from '@/types'
import { logActivity } from '@/lib/logger'
import { EvaluationService } from './evaluationService'

export class CompletionService {
  /**
   * Trigger completion review for an intern
   */
  static async triggerCompletionReview(
    internId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      // Check if intern has evaluation
      const hasEvaluation = await EvaluationService.hasEvaluation(internId)
      
      if (!hasEvaluation) {
        return { 
          success: false, 
          error: 'Intern must have at least one evaluation before completion review' 
        }
      }

      // Update status to COMPLETION_REVIEW
      const { error } = await supabase
        .from('intern_profiles')
        .update({ status: 'COMPLETION_REVIEW' })
        .eq('id', internId)
        .eq('status', 'ACTIVE')

      if (error) {
        console.error('Error triggering completion review:', error)
        return { success: false, error: error.message }
      }

      // Log activity
      await logActivity({
        userId: adminId,
        action: 'completion_review_triggered',
        entityType: 'intern_profile',
        entityId: internId,
        metadata: { status: 'COMPLETION_REVIEW' },
        category: 'action'
      })

      return { success: true }
    } catch (error) {
      console.error('Error in triggerCompletionReview:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Complete internship
   */
  static async completeInternship(
    internId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      // Verify intern is in completion review
      const { data: intern, error: fetchError } = await supabase
        .from('intern_profiles')
        .select('status')
        .eq('id', internId)
        .single()

      if (fetchError || !intern) {
        return { success: false, error: 'Intern not found' }
      }

      if (intern.status !== 'COMPLETION_REVIEW') {
        return { 
          success: false, 
          error: 'Intern must be in completion review status' 
        }
      }

      // Update status to COMPLETED
      const { error } = await supabase
        .from('intern_profiles')
        .update({ 
          status: 'COMPLETED',
          is_active: false
        })
        .eq('id', internId)

      if (error) {
        console.error('Error completing internship:', error)
        return { success: false, error: error.message }
      }

      // Log activity
      await logActivity({
        userId: adminId,
        action: 'internship_completed',
        entityType: 'intern_profile',
        entityId: internId,
        metadata: { status: 'COMPLETED' },
        category: 'action'
      })

      return { success: true }
    } catch (error) {
      console.error('Error in completeInternship:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Extend internship
   */
  static async extendInternship(
    internId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      // Update status to EXTENDED
      const { error } = await supabase
        .from('intern_profiles')
        .update({ status: 'EXTENDED' })
        .eq('id', internId)
        .in('status', ['ACTIVE', 'COMPLETION_REVIEW'])

      if (error) {
        console.error('Error extending internship:', error)
        return { success: false, error: error.message }
      }

      // Log activity
      await logActivity({
        userId: adminId,
        action: 'internship_extended',
        entityType: 'intern_profile',
        entityId: internId,
        metadata: { status: 'EXTENDED', reason },
        category: 'action'
      })

      return { success: true }
    } catch (error) {
      console.error('Error in extendInternship:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Terminate internship
   */
  static async terminateInternship(
    internId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()

      // Update status to TERMINATED
      const { error } = await supabase
        .from('intern_profiles')
        .update({ 
          status: 'TERMINATED',
          is_active: false
        })
        .eq('id', internId)

      if (error) {
        console.error('Error terminating internship:', error)
        return { success: false, error: error.message }
      }

      // Log activity
      await logActivity({
        userId: adminId,
        action: 'internship_terminated',
        entityType: 'intern_profile',
        entityId: internId,
        metadata: { status: 'TERMINATED', reason },
        category: 'action'
      })

      return { success: true }
    } catch (error) {
      console.error('Error in terminateInternship:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get interns in completion review
   */
  static async getCompletionReviewInterns(): Promise<{
    success: boolean
    interns?: CompletionReviewIntern[]
    error?: string
  }> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('intern_lifecycle_summary')
        .select('*')
        .eq('status', 'COMPLETION_REVIEW')
        .order('joined_at', { ascending: false })

      if (error) {
        console.error('Error fetching completion review interns:', error)
        return { success: false, error: error.message }
      }

      const interns: CompletionReviewIntern[] = (data || []).map(intern => ({
        id: intern.id,
        full_name: intern.full_name,
        cohort: intern.cohort,
        status: intern.status,
        has_evaluation: (intern.evaluation_count || 0) > 0,
        evaluation_score: intern.avg_evaluation_score,
        completed_tasks: intern.completed_tasks || 0,
        total_tasks: intern.total_tasks || 0,
        attendance_percentage: intern.attendance_percentage || 0,
        badges_earned: intern.badges_earned || 0
      }))

      return { success: true, interns }
    } catch (error) {
      console.error('Error in getCompletionReviewInterns:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Validate status transition
   */
  static isValidTransition(currentStatus: InternStatus, newStatus: InternStatus): boolean {
    const validTransitions: Record<InternStatus, InternStatus[]> = {
      ACTIVE: ['COMPLETION_REVIEW', 'EXTENDED', 'TERMINATED'],
      COMPLETION_REVIEW: ['COMPLETED', 'EXTENDED', 'TERMINATED'],
      COMPLETED: [],
      EXTENDED: ['COMPLETION_REVIEW', 'TERMINATED'],
      TERMINATED: []
    }

    return validTransitions[currentStatus]?.includes(newStatus) || false
  }
}
