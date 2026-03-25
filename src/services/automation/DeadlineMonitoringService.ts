/**
 * DEADLINE MONITORING SERVICE
 * 
 * Monitors deadlines across the system and triggers alerts
 * for upcoming and overdue items.
 * 
 * Features:
 * - Scans tasks, documents, evaluations, internships
 * - Detects upcoming deadlines (configurable threshold)
 * - Detects overdue items
 * - Creates alerts for interns and admins
 * - Updates deadline tracking status
 */

import { createClient } from '@/lib/supabase/server'
import { RuleEngine } from './RuleEngine'

export class DeadlineMonitoringService {
  
  /**
   * Run complete deadline scan
   */
  static async runDeadlineScan(): Promise<{
    scanned: number
    upcoming: number
    overdue: number
    alertsCreated: number
  }> {
    const results = {
      scanned: 0,
      upcoming: 0,
      overdue: 0,
      alertsCreated: 0
    }
    
    // Scan all deadline types
    const taskResults = await this.scanTaskDeadlines()
    const documentResults = await this.scanDocumentDeadlines()
    const internshipResults = await this.scanInternshipDeadlines()
    
    results.scanned = taskResults.scanned + documentResults.scanned + internshipResults.scanned
    results.upcoming = taskResults.upcoming + documentResults.upcoming + internshipResults.upcoming
    results.overdue = taskResults.overdue + documentResults.overdue + internshipResults.overdue
    results.alertsCreated = taskResults.alertsCreated + documentResults.alertsCreated + internshipResults.alertsCreated
    
    return results
  }
  
  /**
   * Scan task deadlines
   */
  private static async scanTaskDeadlines(): Promise<{
    scanned: number
    upcoming: number
    overdue: number
    alertsCreated: number
  }> {
    const supabase = await createClient()
    const results = { scanned: 0, upcoming: 0, overdue: 0, alertsCreated: 0 }
    
    // Fetch tasks with due dates
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        due_date,
        status,
        assigned_to,
        priority
      `)
      .not('due_date', 'is', null)
      .neq('status', 'done')
      .is('deleted_at', null)
    
    if (error || !tasks) {
      console.error('Error fetching tasks:', error)
      return results
    }
    
    results.scanned = tasks.length
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (const task of tasks) {
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      // Upsert deadline tracking
      const { data: tracking } = await supabase
        .from('deadline_tracking')
        .select('id, alert_sent, status')
        .eq('entity_type', 'task')
        .eq('entity_id', task.id)
        .single()
      
      let newStatus: string
      let shouldAlert = false
      
      if (daysDiff < 0) {
        // Overdue
        newStatus = 'overdue'
        results.overdue++
        shouldAlert = !tracking?.alert_sent
      } else if (daysDiff <= 3) {
        // Upcoming (within 3 days)
        newStatus = 'upcoming'
        results.upcoming++
        shouldAlert = !tracking?.alert_sent
      } else {
        newStatus = 'pending'
      }
      
      // Update or create tracking
      if (tracking) {
        await supabase
          .from('deadline_tracking')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', tracking.id)
      } else {
        await supabase
          .from('deadline_tracking')
          .insert({
            entity_type: 'task',
            entity_id: task.id,
            deadline_date: task.due_date,
            status: newStatus,
            warning_days_before: 3
          })
      }
      
      // Create alerts if needed
      if (shouldAlert && task.assigned_to) {
        const alertType = daysDiff < 0 ? 'deadline_overdue' : 'deadline_warning'
        const severity = daysDiff < 0 ? 'error' : 'warning'
        const message = daysDiff < 0
          ? `Task "${task.title}" is ${Math.abs(daysDiff)} day(s) overdue`
          : `Task "${task.title}" is due in ${daysDiff} day(s)`
        
        await supabase
          .from('automation_alerts')
          .insert({
            alert_type: alertType,
            severity: severity,
            title: daysDiff < 0 ? 'Overdue Task' : 'Upcoming Deadline',
            message: message,
            target_user_id: task.assigned_to,
            entity_type: 'task',
            entity_id: task.id,
            action_url: `/intern/tasks/${task.id}`,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
        
        // Mark alert as sent
        await supabase
          .from('deadline_tracking')
          .update({ 
            alert_sent: true,
            alert_sent_at: new Date().toISOString()
          })
          .eq('entity_type', 'task')
          .eq('entity_id', task.id)
        
        results.alertsCreated++
        
        // Escalate if overdue > 3 days
        if (daysDiff < -3) {
          await this.escalateOverdueTask(task)
        }
      }
    }
    
    return results
  }
  
  /**
   * Scan document expiry deadlines
   */
  private static async scanDocumentDeadlines(): Promise<{
    scanned: number
    upcoming: number
    overdue: number
    alertsCreated: number
  }> {
    const supabase = await createClient()
    const results = { scanned: 0, upcoming: 0, overdue: 0, alertsCreated: 0 }
    
    // Fetch document verification tracking with expiry dates
    const { data: documents, error } = await supabase
      .from('document_verification_tracking')
      .select(`
        id,
        intern_id,
        document_type,
        status,
        expiry_date,
        expiry_warning_days,
        expiry_alert_sent
      `)
      .eq('status', 'verified')
      .not('expiry_date', 'is', null)
    
    if (error || !documents) {
      console.error('Error fetching documents:', error)
      return results
    }
    
    results.scanned = documents.length
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (const doc of documents) {
      const expiryDate = new Date(doc.expiry_date)
      expiryDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff < 0) {
        // Expired
        results.overdue++
        
        // Update status
        await supabase
          .from('document_verification_tracking')
          .update({ status: 'expired' })
          .eq('id', doc.id)
        
        // Create alert if not sent
        if (!doc.expiry_alert_sent) {
          await this.createDocumentAlert(
            doc.intern_id,
            doc.document_type,
            'expired',
            Math.abs(daysDiff)
          )
          results.alertsCreated++
        }
        
      } else if (daysDiff <= (doc.expiry_warning_days || 30)) {
        // Expiring soon
        results.upcoming++
        
        if (!doc.expiry_alert_sent) {
          await this.createDocumentAlert(
            doc.intern_id,
            doc.document_type,
            'expiring',
            daysDiff
          )
          
          await supabase
            .from('document_verification_tracking')
            .update({ 
              expiry_alert_sent: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.id)
          
          results.alertsCreated++
        }
      }
    }
    
    return results
  }
  
  /**
   * Scan internship completion deadlines
   */
  private static async scanInternshipDeadlines(): Promise<{
    scanned: number
    upcoming: number
    overdue: number
    alertsCreated: number
  }> {
    const supabase = await createClient()
    const results = { scanned: 0, upcoming: 0, overdue: 0, alertsCreated: 0 }
    
    // Fetch active interns with end dates
    const { data: interns, error } = await supabase
      .from('intern_profiles')
      .select(`
        id,
        full_name,
        user_id,
        start_date,
        end_date,
        status
      `)
      .eq('is_active', true)
      .eq('status', 'ACTIVE')
      .not('end_date', 'is', null)
      .is('deleted_at', null)
    
    if (error || !interns) {
      console.error('Error fetching interns:', error)
      return results
    }
    
    results.scanned = interns.length
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (const intern of interns) {
      const endDate = new Date(intern.end_date)
      endDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      // Check for 7 days before completion
      if (daysDiff === 7) {
        results.upcoming++
        
        await supabase
          .from('automation_alerts')
          .insert({
            alert_type: 'milestone_reached',
            severity: 'info',
            title: 'Internship Ending Soon',
            message: `Your internship ends in 7 days. Please complete all pending tasks.`,
            target_user_id: intern.user_id,
            target_intern_id: intern.id,
            action_url: '/intern/dashboard',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
        
        results.alertsCreated++
      }
      
      // Check for completion day
      if (daysDiff === 0) {
        results.overdue++
        
        // Update status to completion review
        await supabase
          .from('intern_profiles')
          .update({ status: 'COMPLETION_REVIEW' })
          .eq('id', intern.id)
        
        // Alert admin
        const { data: admins } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'admin')
        
        if (admins) {
          for (const admin of admins) {
            await supabase
              .from('automation_alerts')
              .insert({
                alert_type: 'review_ready',
                severity: 'warning',
                title: 'Intern Completion Review Required',
                message: `${intern.full_name}'s internship has ended. Review required.`,
                target_user_id: admin.id,
                target_intern_id: intern.id,
                action_url: `/admin/completion-reviews`,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              })
          }
          results.alertsCreated++
        }
      }
    }
    
    return results
  }
  
  /**
   * Escalate overdue task to admin
   */
  private static async escalateOverdueTask(task: any): Promise<void> {
    const supabase = await createClient()
    
    // Check if already escalated
    const { data: existing } = await supabase
      .from('deadline_tracking')
      .select('escalation_required, escalated_at')
      .eq('entity_type', 'task')
      .eq('entity_id', task.id)
      .single()
    
    if (existing?.escalated_at) return  // Already escalated
    
    // Mark as escalated
    await supabase
      .from('deadline_tracking')
      .update({ 
        escalation_required: true,
        escalated_at: new Date().toISOString()
      })
      .eq('entity_type', 'task')
      .eq('entity_id', task.id)
    
    // Alert admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
    
    if (admins) {
      for (const admin of admins) {
        await supabase
          .from('automation_alerts')
          .insert({
            alert_type: 'escalation',
            severity: 'critical',
            title: 'Task Severely Overdue',
            message: `Task "${task.title}" is severely overdue and requires immediate attention.`,
            target_user_id: admin.id,
            entity_type: 'task',
            entity_id: task.id,
            action_url: `/admin/tasks/${task.id}`
          })
      }
    }
  }
  
  /**
   * Create document alert
   */
  private static async createDocumentAlert(
    internId: string,
    documentType: string,
    alertType: 'expired' | 'expiring',
    days: number
  ): Promise<void> {
    const supabase = await createClient()
    
    // Get intern user_id
    const { data: intern } = await supabase
      .from('intern_profiles')
      .select('user_id, full_name')
      .eq('id', internId)
      .single()
    
    if (!intern?.user_id) return
    
    const message = alertType === 'expired'
      ? `Your ${documentType} has expired ${days} day(s) ago. Please upload a new one.`
      : `Your ${documentType} will expire in ${days} day(s). Please renew it.`
    
    await supabase
      .from('automation_alerts')
      .insert({
        alert_type: alertType === 'expired' ? 'document_missing' : 'document_expiring',
        severity: alertType === 'expired' ? 'error' : 'warning',
        title: alertType === 'expired' ? 'Document Expired' : 'Document Expiring Soon',
        message: message,
        target_user_id: intern.user_id,
        target_intern_id: internId,
        action_url: '/intern/documents',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
    
    // Also alert admin
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
    
    if (admins) {
      for (const admin of admins) {
        await supabase
          .from('automation_alerts')
          .insert({
            alert_type: alertType === 'expired' ? 'document_missing' : 'document_expiring',
            severity: 'warning',
            title: `Intern Document ${alertType === 'expired' ? 'Expired' : 'Expiring'}`,
            message: `${intern.full_name}'s ${documentType} ${alertType === 'expired' ? 'has expired' : 'is expiring soon'}.`,
            target_user_id: admin.id,
            target_intern_id: internId,
            action_url: `/admin/interns/${internId}`
          })
      }
    }
  }
  
  /**
   * Get deadline statistics
   */
  static async getDeadlineStatistics(): Promise<{
    total: number
    upcoming: number
    overdue: number
    byType: Record<string, { upcoming: number; overdue: number }>
  }> {
    const supabase = await createClient()
    
    const { data: deadlines } = await supabase
      .from('deadline_tracking')
      .select('entity_type, status')
      .in('status', ['upcoming', 'overdue'])
    
    const stats = {
      total: deadlines?.length || 0,
      upcoming: deadlines?.filter(d => d.status === 'upcoming').length || 0,
      overdue: deadlines?.filter(d => d.status === 'overdue').length || 0,
      byType: {} as Record<string, { upcoming: number; overdue: number }>
    }
    
    // Group by type
    deadlines?.forEach(d => {
      if (!stats.byType[d.entity_type]) {
        stats.byType[d.entity_type] = { upcoming: 0, overdue: 0 }
      }
      if (d.status === 'upcoming') {
        stats.byType[d.entity_type].upcoming++
      } else {
        stats.byType[d.entity_type].overdue++
      }
    })
    
    return stats
  }
}
