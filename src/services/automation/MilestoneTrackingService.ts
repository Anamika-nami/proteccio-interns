/**
 * MILESTONE TRACKING SERVICE
 * 
 * Tracks intern tenure milestones and triggers notifications
 * at key points in the internship lifecycle.
 * 
 * Milestones:
 * - 25% tenure completed
 * - 50% tenure completed
 * - 75% tenure completed
 * - 90% tenure completed
 * - 7 days before completion
 * - Completion day
 * - Extension decision due
 */

import { createClient } from '@/lib/supabase/server'

export class MilestoneTrackingService {
  
  /**
   * Initialize milestone tracking for an intern
   */
  static async initializeMilestones(internId: string): Promise<void> {
    const supabase = await createClient()
    
    // Get intern details
    const { data: intern, error } = await supabase
      .from('intern_profiles')
      .select('id, full_name, start_date, end_date')
      .eq('id', internId)
      .single()
    
    if (error || !intern || !intern.start_date || !intern.end_date) {
      console.error('Cannot initialize milestones:', error)
      return
    }
    
    const startDate = new Date(intern.start_date)
    const endDate = new Date(intern.end_date)
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calculate milestone dates
    const milestones = [
      {
        type: 'tenure_25_percent',
        date: new Date(startDate.getTime() + (totalDays * 0.25 * 24 * 60 * 60 * 1000))
      },
      {
        type: 'tenure_50_percent',
        date: new Date(startDate.getTime() + (totalDays * 0.50 * 24 * 60 * 60 * 1000))
      },
      {
        type: 'tenure_75_percent',
        date: new Date(startDate.getTime() + (totalDays * 0.75 * 24 * 60 * 60 * 1000))
      },
      {
        type: 'tenure_90_percent',
        date: new Date(startDate.getTime() + (totalDays * 0.90 * 24 * 60 * 60 * 1000))
      },
      {
        type: 'completion_approaching',
        date: new Date(endDate.getTime() - (7 * 24 * 60 * 60 * 1000))
      },
      {
        type: 'completion_due',
        date: endDate
      }
    ]
    
    // Insert milestones
    for (const milestone of milestones) {
      await supabase
        .from('milestone_tracking')
        .upsert({
          intern_id: internId,
          milestone_type: milestone.type,
          milestone_date: milestone.date.toISOString().split('T')[0],
          status: 'pending'
        }, {
          onConflict: 'intern_id,milestone_type'
        })
    }
  }
  
  /**
   * Check and trigger pending milestones
   */
  static async checkMilestones(): Promise<{
    checked: number
    triggered: number
    notificationsSent: number
  }> {
    const supabase = await createClient()
    const results = { checked: 0, triggered: 0, notificationsSent: 0 }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Fetch pending milestones that are due
    const { data: milestones, error } = await supabase
      .from('milestone_tracking')
      .select(`
        id,
        intern_id,
        milestone_type,
        milestone_date,
        intern_profiles (
          id,
          full_name,
          user_id,
          start_date,
          end_date
        )
      `)
      .eq('status', 'pending')
      .lte('milestone_date', today.toISOString().split('T')[0])
    
    if (error || !milestones) {
      console.error('Error fetching milestones:', error)
      return results
    }
    
    results.checked = milestones.length
    
    for (const milestone of milestones) {
      const intern = milestone.intern_profiles as any
      if (!intern) continue
      
      // Trigger milestone
      await this.triggerMilestone(milestone.id, milestone.milestone_type, intern)
      results.triggered++
      
      // Send notifications
      const notificationsSent = await this.sendMilestoneNotifications(
        milestone.milestone_type,
        intern
      )
      results.notificationsSent += notificationsSent
      
      // Update milestone status
      await supabase
        .from('milestone_tracking')
        .update({
          status: 'triggered',
          triggered_at: new Date().toISOString(),
          notification_sent: true,
          notification_sent_at: new Date().toISOString()
        })
        .eq('id', milestone.id)
    }
    
    return results
  }
  
  /**
   * Trigger a specific milestone
   */
  private static async triggerMilestone(
    milestoneId: string,
    milestoneType: string,
    intern: any
  ): Promise<void> {
    const supabase = await createClient()
    
    // Emit workflow event
    await supabase.rpc('emit_workflow_event', {
      p_event_type: `milestone.${milestoneType}`,
      p_event_category: 'intern_lifecycle',
      p_entity_type: 'intern',
      p_entity_id: intern.id,
      p_payload: {
        milestone_type: milestoneType,
        intern_name: intern.full_name,
        start_date: intern.start_date,
        end_date: intern.end_date
      }
    })
  }
  
  /**
   * Send milestone notifications
   */
  private static async sendMilestoneNotifications(
    milestoneType: string,
    intern: any
  ): Promise<number> {
    const supabase = await createClient()
    let notificationsSent = 0
    
    const messages = this.getMilestoneMessages(milestoneType, intern)
    
    // Send to intern
    if (messages.intern && intern.user_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: intern.user_id,
          type: 'milestone',
          message: messages.intern,
          link: '/intern/dashboard'
        })
      notificationsSent++
      
      // Also create automation alert
      await supabase
        .from('automation_alerts')
        .insert({
          alert_type: 'milestone_reached',
          severity: 'info',
          title: messages.internTitle,
          message: messages.intern,
          target_user_id: intern.user_id,
          target_intern_id: intern.id,
          action_url: '/intern/dashboard'
        })
    }
    
    // Send to admins for certain milestones
    if (messages.admin) {
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
      
      if (admins) {
        for (const admin of admins) {
          await supabase
            .from('notifications')
            .insert({
              user_id: admin.id,
              type: 'milestone',
              message: messages.admin,
              link: `/admin/interns/${intern.id}`
            })
          
          await supabase
            .from('automation_alerts')
            .insert({
              alert_type: 'milestone_reached',
              severity: messages.adminSeverity || 'info',
              title: messages.adminTitle,
              message: messages.admin,
              target_user_id: admin.id,
              target_intern_id: intern.id,
              action_url: `/admin/interns/${intern.id}`
            })
        }
        notificationsSent += admins.length
      }
    }
    
    return notificationsSent
  }
  
  /**
   * Get milestone-specific messages
   */
  private static getMilestoneMessages(milestoneType: string, intern: any): {
    intern?: string
    internTitle: string
    admin?: string
    adminTitle: string
    adminSeverity?: string
  } {
    const name = intern.full_name
    
    switch (milestoneType) {
      case 'tenure_25_percent':
        return {
          intern: `Congratulations! You've completed 25% of your internship. Keep up the great work!`,
          internTitle: '25% Milestone Reached',
          adminTitle: 'Intern 25% Milestone'
        }
      
      case 'tenure_50_percent':
        return {
          intern: `You're halfway through your internship! 50% completed. Time to reflect on your progress and set goals for the remaining period.`,
          internTitle: '50% Milestone Reached',
          admin: `${name} has completed 50% of their internship. Consider scheduling a mid-term evaluation.`,
          adminTitle: 'Intern 50% Milestone - Evaluation Recommended',
          adminSeverity: 'warning'
        }
      
      case 'tenure_75_percent':
        return {
          intern: `You've completed 75% of your internship! Start preparing for your final evaluation and completion.`,
          internTitle: '75% Milestone Reached',
          admin: `${name} has completed 75% of their internship. Begin planning for completion review.`,
          adminTitle: 'Intern 75% Milestone - Completion Planning',
          adminSeverity: 'warning'
        }
      
      case 'tenure_90_percent':
        return {
          intern: `You're in the final stretch! 90% completed. Ensure all tasks and documentation are up to date.`,
          internTitle: '90% Milestone Reached',
          admin: `${name} has completed 90% of their internship. Final evaluation and completion review should be scheduled soon.`,
          adminTitle: 'Intern 90% Milestone - Final Review Needed',
          adminSeverity: 'warning'
        }
      
      case 'completion_approaching':
        return {
          intern: `Your internship ends in 7 days. Please complete all pending tasks and prepare for your final evaluation.`,
          internTitle: 'Internship Ending Soon',
          admin: `${name}'s internship ends in 7 days. Schedule final evaluation and prepare completion review.`,
          adminTitle: 'Intern Completion Approaching - Action Required',
          adminSeverity: 'error'
        }
      
      case 'completion_due':
        return {
          intern: `Your internship period has ended. Your performance is under review. You'll be notified of the outcome soon.`,
          internTitle: 'Internship Completed',
          admin: `${name}'s internship has ended. Immediate completion review required to determine outcome (Completed/Extended/Terminated).`,
          adminTitle: 'Intern Completion Review Required - URGENT',
          adminSeverity: 'critical'
        }
      
      default:
        return {
          intern: `Milestone reached: ${milestoneType}`,
          internTitle: 'Milestone Reached',
          adminTitle: 'Intern Milestone'
        }
    }
  }
  
  /**
   * Get intern milestone progress
   */
  static async getInternMilestones(internId: string): Promise<any[]> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('milestone_tracking')
      .select('*')
      .eq('intern_id', internId)
      .order('milestone_date', { ascending: true })
    
    if (error) {
      console.error('Error fetching milestones:', error)
      return []
    }
    
    return data || []
  }
  
  /**
   * Calculate current tenure percentage
   */
  static async calculateTenurePercentage(internId: string): Promise<number> {
    const supabase = await createClient()
    
    const { data: intern } = await supabase
      .from('intern_profiles')
      .select('start_date, end_date')
      .eq('id', internId)
      .single()
    
    if (!intern?.start_date || !intern?.end_date) return 0
    
    const startDate = new Date(intern.start_date)
    const endDate = new Date(intern.end_date)
    const today = new Date()
    
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const elapsedDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const percentage = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
    
    return Math.round(percentage * 100) / 100
  }
}
