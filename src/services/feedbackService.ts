import { createClient } from '@/lib/supabase/server'
import type { InternFeedback, CreateFeedbackDTO, FeedbackAnalytics } from '@/types'
import { logActivity } from '@/lib/logger'

export class FeedbackService {
  /**
   * Submit intern feedback
   */
  static async submitFeedback(
    userId: string,
    data: CreateFeedbackDTO
  ): Promise<{ success: boolean; feedback?: InternFeedback; error?: string }> {
    try {
      const supabase = await createClient()

      // Validate ratings
      const ratings = [
        data.learning_experience_rating,
        data.task_difficulty_rating,
        data.mentorship_rating,
        data.program_structure_rating
      ]

      if (ratings.some(rating => rating < 1 || rating > 5)) {
        return { success: false, error: 'All ratings must be between 1 and 5' }
      }

      // Insert feedback
      const { data: feedback, error } = await supabase
        .from('intern_feedback')
        .insert({
          intern_id: data.intern_id,
          learning_experience_rating: data.learning_experience_rating,
          task_difficulty_rating: data.task_difficulty_rating,
          mentorship_rating: data.mentorship_rating,
          program_structure_rating: data.program_structure_rating,
          suggestions: data.suggestions || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error submitting feedback:', error)
        return { success: false, error: error.message }
      }

      // Log activity
      await logActivity({
        userId: userId,
        action: 'feedback_submitted',
        entityType: 'intern_feedback',
        entityId: feedback.id,
        metadata: { intern_id: data.intern_id },
        category: 'action'
      })

      return { success: true, feedback }
    } catch (error) {
      console.error('Error in submitFeedback:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get feedback for an intern
   */
  static async getInternFeedback(
    internId: string
  ): Promise<{ success: boolean; feedback?: InternFeedback; error?: string }> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('intern_feedback')
        .select('*')
        .eq('intern_id', internId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: true, feedback: undefined }
        }
        console.error('Error fetching feedback:', error)
        return { success: false, error: error.message }
      }

      return { success: true, feedback: data }
    } catch (error) {
      console.error('Error in getInternFeedback:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get feedback analytics for admin
   */
  static async getFeedbackAnalytics(): Promise<{
    success: boolean
    analytics?: FeedbackAnalytics
    error?: string
  }> {
    try {
      const supabase = await createClient()

      // Fetch all feedback
      const { data: feedbackData, error } = await supabase
        .from('intern_feedback')
        .select(`
          *,
          intern_profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching feedback analytics:', error)
        return { success: false, error: error.message }
      }

      if (!feedbackData || feedbackData.length === 0) {
        return {
          success: true,
          analytics: {
            total_responses: 0,
            average_ratings: {
              learning_experience: 0,
              task_difficulty: 0,
              mentorship: 0,
              program_structure: 0
            },
            rating_distribution: [],
            recent_suggestions: []
          }
        }
      }

      // Calculate averages
      const total = feedbackData.length
      const sums = feedbackData.reduce(
        (acc, curr) => ({
          learning_experience: acc.learning_experience + curr.learning_experience_rating,
          task_difficulty: acc.task_difficulty + curr.task_difficulty_rating,
          mentorship: acc.mentorship + curr.mentorship_rating,
          program_structure: acc.program_structure + curr.program_structure_rating
        }),
        { learning_experience: 0, task_difficulty: 0, mentorship: 0, program_structure: 0 }
      )

      const average_ratings = {
        learning_experience: Math.round((sums.learning_experience / total) * 100) / 100,
        task_difficulty: Math.round((sums.task_difficulty / total) * 100) / 100,
        mentorship: Math.round((sums.mentorship / total) * 100) / 100,
        program_structure: Math.round((sums.program_structure / total) * 100) / 100
      }

      // Calculate rating distribution (for learning experience)
      const distribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: feedbackData.filter(f => f.learning_experience_rating === rating).length
      }))

      // Get recent suggestions
      const recent_suggestions = feedbackData
        .filter(f => f.suggestions)
        .slice(0, 10)
        .map(f => ({
          intern_name: (f as any).intern_profiles?.full_name || 'Unknown',
          suggestion: f.suggestions || '',
          created_at: f.created_at
        }))

      const analytics: FeedbackAnalytics = {
        total_responses: total,
        average_ratings,
        rating_distribution: distribution,
        recent_suggestions
      }

      return { success: true, analytics }
    } catch (error) {
      console.error('Error in getFeedbackAnalytics:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Check if intern has submitted feedback
   */
  static async hasFeedback(internId: string): Promise<boolean> {
    try {
      const supabase = await createClient()

      const { count, error } = await supabase
        .from('intern_feedback')
        .select('*', { count: 'exact', head: true })
        .eq('intern_id', internId)

      if (error) {
        console.error('Error checking feedback:', error)
        return false
      }

      return (count || 0) > 0
    } catch (error) {
      console.error('Error in hasFeedback:', error)
      return false
    }
  }
}
