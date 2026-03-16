import { createClient } from '@/lib/supabase/server'
import type { InternReport } from '@/types'
import { EvaluationService } from './evaluationService'
import { BadgeService } from './badgeService'
import { FeedbackService } from './feedbackService'
import { logActivity } from '@/lib/logger'

export class ReportService {
  /**
   * Generate comprehensive intern report
   */
  static async generateInternReport(
    internId: string
  ): Promise<{ success: boolean; report?: InternReport; error?: string }> {
    try {
      const supabase = await createClient()

      // Fetch intern profile
      const { data: intern, error: internError } = await supabase
        .from('intern_profiles')
        .select('*')
        .eq('id', internId)
        .single()

      if (internError || !intern) {
        return { success: false, error: 'Intern not found' }
      }

      // Fetch attendance summary
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status, working_hours')
        .eq('intern_id', internId)

      const attendance = {
        present_days: attendanceData?.filter(a => a.status === 'present').length || 0,
        absent_days: attendanceData?.filter(a => a.status === 'absent').length || 0,
        half_days: attendanceData?.filter(a => a.status === 'half_day').length || 0,
        leave_days: attendanceData?.filter(a => a.status === 'leave').length || 0,
        total_days: attendanceData?.length || 0,
        attendance_percentage: 0,
        total_hours_worked: attendanceData?.reduce((sum, a) => sum + (a.working_hours || 0), 0) || 0
      }

      if (attendance.total_days > 0) {
        attendance.attendance_percentage = Math.round(
          (attendance.present_days / attendance.total_days) * 100
        )
      }

      // Fetch task statistics
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('status')
        .eq('assigned_to', internId)

      const tasks = {
        total_tasks: tasksData?.length || 0,
        completed_tasks: tasksData?.filter(t => t.status === 'done').length || 0,
        in_progress_tasks: tasksData?.filter(t => t.status === 'in_progress').length || 0,
        pending_tasks: tasksData?.filter(t => t.status === 'todo').length || 0,
        completion_rate: 0
      }

      if (tasks.total_tasks > 0) {
        tasks.completion_rate = Math.round(
          (tasks.completed_tasks / tasks.total_tasks) * 100
        )
      }

      // Fetch evaluations
      const evaluationsResult = await EvaluationService.getInternEvaluations(internId)
      const evaluations = evaluationsResult.evaluations || []

      // Fetch badges
      const badgesResult = await BadgeService.getInternBadges(internId)
      const badges = badgesResult.badges || []

      // Fetch feedback
      const feedbackResult = await FeedbackService.getInternFeedback(internId)
      const feedback = feedbackResult.feedback || null

      // Skills progression (simplified - would need historical tracking)
      const skills = {
        initial_skills: intern.skills || [],
        current_skills: intern.skills || [],
        skills_added: []
      }

      const report: InternReport = {
        intern: {
          id: intern.id,
          full_name: intern.full_name,
          cohort: intern.cohort,
          bio: intern.bio,
          skills: intern.skills || [],
          status: intern.status || 'ACTIVE',
          joined_at: intern.created_at
        },
        attendance,
        tasks,
        skills,
        evaluations,
        badges,
        feedback
      }

      return { success: true, report }
    } catch (error) {
      console.error('Error generating intern report:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Export report as structured data (for PDF generation)
   */
  static async exportReportData(
    internId: string,
    userId: string
  ): Promise<{ success: boolean; data?: InternReport; error?: string }> {
    try {
      const result = await this.generateInternReport(internId)

      if (!result.success || !result.report) {
        return result
      }

      // Log export activity
      await logActivity({
        userId: userId,
        action: 'report_exported',
        entityType: 'intern_profile',
        entityId: internId,
        metadata: { export_type: 'completion_report' },
        category: 'data_export'
      })

      return { success: true, data: result.report }
    } catch (error) {
      console.error('Error exporting report:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get summary statistics for all interns
   */
  static async getOverallStatistics(): Promise<{
    success: boolean
    statistics?: {
      total_interns: number
      active_interns: number
      completed_interns: number
      avg_completion_rate: number
      avg_attendance: number
      total_badges_earned: number
    }
    error?: string
  }> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('intern_lifecycle_summary')
        .select('*')

      if (error) {
        console.error('Error fetching overall statistics:', error)
        return { success: false, error: error.message }
      }

      const statistics = {
        total_interns: data?.length || 0,
        active_interns: data?.filter(i => i.is_active).length || 0,
        completed_interns: data?.filter(i => i.status === 'COMPLETED').length || 0,
        avg_completion_rate: 0,
        avg_attendance: 0,
        total_badges_earned: data?.reduce((sum, i) => sum + (i.badges_earned || 0), 0) || 0
      }

      if (data && data.length > 0) {
        const totalTasks = data.reduce((sum, i) => sum + (i.total_tasks || 0), 0)
        const completedTasks = data.reduce((sum, i) => sum + (i.completed_tasks || 0), 0)
        
        if (totalTasks > 0) {
          statistics.avg_completion_rate = Math.round((completedTasks / totalTasks) * 100)
        }

        const totalAttendance = data.reduce((sum, i) => sum + (i.attendance_percentage || 0), 0)
        statistics.avg_attendance = Math.round(totalAttendance / data.length)
      }

      return { success: true, statistics }
    } catch (error) {
      console.error('Error in getOverallStatistics:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}
