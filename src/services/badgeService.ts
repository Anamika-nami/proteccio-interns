import { createClient } from '@/lib/supabase/server'
import type { Badge, InternBadge, InternBadgeWithDetails } from '@/types'
import { logActivity } from '@/lib/logger'

export class BadgeService {
  /**
   * Get all available badges
   */
  static async getAllBadges(): Promise<{
    success: boolean
    badges?: Badge[]
    error?: string
  }> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching badges:', error)
        return { success: false, error: error.message }
      }

      return { success: true, badges: data || [] }
    } catch (error) {
      console.error('Error in getAllBadges:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get badges earned by an intern
   */
  static async getInternBadges(
    internId: string
  ): Promise<{
    success: boolean
    badges?: InternBadgeWithDetails[]
    error?: string
  }> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('intern_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('intern_id', internId)
        .order('earned_at', { ascending: false })

      if (error) {
        console.error('Error fetching intern badges:', error)
        return { success: false, error: error.message }
      }

      const badges: InternBadgeWithDetails[] = (data || []).map(item => ({
        id: item.id,
        intern_id: item.intern_id,
        badge_id: item.badge_id,
        earned_at: item.earned_at,
        badge: item.badge as Badge
      }))

      return { success: true, badges }
    } catch (error) {
      console.error('Error in getInternBadges:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Assign badge to intern
   */
  static async assignBadge(
    internId: string,
    badgeName: string,
    adminId: string
  ): Promise<{ success: boolean; badge?: InternBadge; error?: string }> {
    try {
      const supabase = await createClient()

      // Get badge ID
      const { data: badge, error: badgeError } = await supabase
        .from('badges')
        .select('id')
        .eq('name', badgeName)
        .single()

      if (badgeError || !badge) {
        return { success: false, error: 'Badge not found' }
      }

      // Assign badge
      const { data, error } = await supabase
        .from('intern_badges')
        .insert({
          intern_id: internId,
          badge_id: badge.id
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Badge already earned' }
        }
        console.error('Error assigning badge:', error)
        return { success: false, error: error.message }
      }

      // Log activity
      await logActivity({
        userId: adminId,
        action: 'badge_assigned',
        entityType: 'intern_badge',
        entityId: data.id,
        metadata: { intern_id: internId, badge_name: badgeName },
        category: 'action'
      })

      return { success: true, badge: data }
    } catch (error) {
      console.error('Error in assignBadge:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Evaluate and auto-assign badges based on criteria
   */
  static async evaluateBadges(
    internId: string,
    adminId: string
  ): Promise<{ success: boolean; assignedBadges?: string[]; error?: string }> {
    try {
      const supabase = await createClient()
      const assignedBadges: string[] = []

      // Fetch intern data
      const { data: intern, error: internError } = await supabase
        .from('intern_profiles')
        .select('id, status')
        .eq('id', internId)
        .single()

      if (internError || !intern) {
        return { success: false, error: 'Intern not found' }
      }

      // Check TASK_MASTER (20+ completed tasks)
      const { count: taskCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', internId)
        .eq('status', 'done')

      if ((taskCount || 0) >= 20) {
        const result = await this.assignBadge(internId, 'TASK_MASTER', adminId)
        if (result.success) {
          assignedBadges.push('TASK_MASTER')
        }
      }

      // Check CONSISTENT_PERFORMER (90%+ attendance)
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('intern_id', internId)

      if (attendanceData && attendanceData.length > 0) {
        const presentDays = attendanceData.filter(a => a.status === 'present').length
        const attendancePercentage = (presentDays / attendanceData.length) * 100

        if (attendancePercentage >= 90) {
          const result = await this.assignBadge(internId, 'CONSISTENT_PERFORMER', adminId)
          if (result.success) {
            assignedBadges.push('CONSISTENT_PERFORMER')
          }
        }
      }

      // Check EARLY_FINISHER (completed status)
      if (intern.status === 'COMPLETED') {
        const result = await this.assignBadge(internId, 'EARLY_FINISHER', adminId)
        if (result.success) {
          assignedBadges.push('EARLY_FINISHER')
        }
      }

      return { success: true, assignedBadges }
    } catch (error) {
      console.error('Error in evaluateBadges:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get badge statistics
   */
  static async getBadgeStatistics(): Promise<{
    success: boolean
    statistics?: Array<{ badge_name: string; earned_count: number }>
    error?: string
  }> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('intern_badges')
        .select(`
          badge_id,
          badges!inner(name)
        `)

      if (error) {
        console.error('Error fetching badge statistics:', error)
        return { success: false, error: error.message }
      }

      // Count badges
      const badgeCounts = (data || []).reduce((acc, curr) => {
        const badgeName = (curr as any).badges?.name
        if (badgeName) {
          acc[badgeName] = (acc[badgeName] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

      const statistics = Object.entries(badgeCounts).map(([badge_name, earned_count]) => ({
        badge_name,
        earned_count
      }))

      return { success: true, statistics }
    } catch (error) {
      console.error('Error in getBadgeStatistics:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}
