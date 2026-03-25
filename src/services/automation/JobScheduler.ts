/**
 * JOB SCHEDULER SERVICE
 * 
 * Manages scheduled jobs for workflow automation.
 * Implements distributed locking to prevent concurrent execution.
 * 
 * Jobs:
 * - Rule execution (cron-based rules)
 * - Deadline scanning
 * - Milestone checking
 * - Document verification
 * - Recommendation updates
 * - Performance metrics refresh
 */

import { createClient } from '@/lib/supabase/server'
import { RuleEngine } from './RuleEngine'
import { DeadlineMonitoringService } from './DeadlineMonitoringService'
import { MilestoneTrackingService } from './MilestoneTrackingService'
import { RecommendationEngine } from './RecommendationEngine'

export class JobScheduler {
  private static readonly LOCK_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
  private static readonly WORKER_ID = `worker-${process.pid}-${Date.now()}`
  
  /**
   * Execute all due scheduled jobs
   */
  static async executeDueJobs(): Promise<{
    executed: number
    failed: number
    skipped: number
  }> {
    const supabase = await createClient()
    const results = { executed: 0, failed: 0, skipped: 0 }
    
    // Fetch due jobs
    const { data: jobs, error } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('is_active', true)
      .eq('is_locked', false)
      .lte('next_run_at', new Date().toISOString())
    
    if (error || !jobs) {
      console.error('Error fetching scheduled jobs:', error)
      return results
    }
    
    for (const job of jobs) {
      try {
        // Acquire lock
        const locked = await this.acquireLock(job.id)
        if (!locked) {
          results.skipped++
          continue
        }
        
        // Execute job
        const startTime = Date.now()
        await this.executeJob(job)
        const duration = Date.now() - startTime
        
        // Update job status
        await this.updateJobStatus(job.id, 'success', duration)
        results.executed++
        
      } catch (error) {
        console.error(`Error executing job ${job.id}:`, error)
        await this.updateJobStatus(
          job.id, 
          'failed', 
          0, 
          error instanceof Error ? error.message : 'Unknown error'
        )
        results.failed++
        
      } finally {
        // Release lock
        await this.releaseLock(job.id)
      }
    }
    
    return results
  }
  
  /**
   * Execute a specific job
   */
  private static async executeJob(job: any): Promise<void> {
    console.log(`Executing job: ${job.job_type} (${job.id})`)
    
    switch (job.job_type) {
      case 'rule_execution':
        await this.executeRuleJob(job)
        break
      
      case 'deadline_scan':
        await this.executeDeadlineScan(job)
        break
      
      case 'milestone_check':
        await this.executeMilestoneCheck(job)
        break
      
      case 'document_verification':
        await this.executeDocumentVerification(job)
        break
      
      case 'recommendation_update':
        await this.executeRecommendationUpdate(job)
        break
      
      case 'cleanup':
        await this.executeCleanup(job)
        break
      
      default:
        console.warn(`Unknown job type: ${job.job_type}`)
    }
  }
  
  /**
   * Execute scheduled rules
   */
  private static async executeRuleJob(job: any): Promise<void> {
    const supabase = await createClient()
    
    // Fetch rules with matching cron schedule
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select(`
        *,
        rule_conditions (*),
        rule_actions (*)
      `)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .eq('trigger_type', 'schedule')
      .order('priority', { ascending: false })
    
    if (error || !rules) {
      console.error('Error fetching scheduled rules:', error)
      return
    }
    
    // Execute each rule
    for (const rule of rules) {
      try {
        await RuleEngine.executeRule(rule)
      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error)
      }
    }
  }
  
  /**
   * Execute deadline scan
   */
  private static async executeDeadlineScan(job: any): Promise<void> {
    const results = await DeadlineMonitoringService.runDeadlineScan()
    console.log('Deadline scan results:', results)
  }
  
  /**
   * Execute milestone check
   */
  private static async executeMilestoneCheck(job: any): Promise<void> {
    const results = await MilestoneTrackingService.checkMilestones()
    console.log('Milestone check results:', results)
  }
  
  /**
   * Execute document verification check
   */
  private static async executeDocumentVerification(job: any): Promise<void> {
    const supabase = await createClient()
    
    // Check for missing mandatory documents
    const { data: interns } = await supabase
      .from('intern_profiles')
      .select('id, full_name, user_id')
      .eq('is_active', true)
      .is('deleted_at', null)
    
    if (!interns) return
    
    const mandatoryDocuments = [
      'ID_PROOF',
      'ADDRESS_PROOF',
      'EDUCATIONAL_CERTIFICATE'
    ]
    
    for (const intern of interns) {
      for (const docType of mandatoryDocuments) {
        // Check if document exists
        const { data: tracking } = await supabase
          .from('document_verification_tracking')
          .select('id, status, missing_alert_sent')
          .eq('intern_id', intern.id)
          .eq('document_type', docType)
          .single()
        
        if (!tracking || tracking.status === 'missing') {
          // Create or update tracking
          if (!tracking) {
            await supabase
              .from('document_verification_tracking')
              .insert({
                intern_id: intern.id,
                document_type: docType,
                is_mandatory: true,
                status: 'missing'
              })
          }
          
          // Send alert if not already sent
          if (!tracking?.missing_alert_sent) {
            await supabase
              .from('automation_alerts')
              .insert({
                alert_type: 'document_missing',
                severity: 'warning',
                title: 'Mandatory Document Missing',
                message: `Please upload your ${docType.replace('_', ' ')}`,
                target_user_id: intern.user_id,
                target_intern_id: intern.id,
                action_url: '/intern/documents'
              })
            
            // Mark alert as sent
            if (tracking) {
              await supabase
                .from('document_verification_tracking')
                .update({ 
                  missing_alert_sent: true,
                  missing_alert_sent_at: new Date().toISOString()
                })
                .eq('id', tracking.id)
            }
          }
        }
      }
    }
  }
  
  /**
   * Execute recommendation update
   */
  private static async executeRecommendationUpdate(job: any): Promise<void> {
    const supabase = await createClient()
    
    // Refresh performance metrics materialized view
    await supabase.rpc('refresh_performance_metrics')
    
    // Generate admin recommendations
    await RecommendationEngine.generateAdminRecommendations()
    
    // Generate intern recommendations (for active interns)
    const { data: interns } = await supabase
      .from('intern_profiles')
      .select('id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .limit(100)  // Process in batches
    
    if (interns) {
      for (const intern of interns) {
        try {
          await RecommendationEngine.generateInternRecommendations(intern.id)
        } catch (error) {
          console.error(`Error generating recommendations for intern ${intern.id}:`, error)
        }
      }
    }
  }
  
  /**
   * Execute cleanup job
   */
  private static async executeCleanup(job: any): Promise<void> {
    const supabase = await createClient()
    
    const config = job.config || {}
    const retentionDays = config.retention_days || 90
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
    
    // Clean old workflow events
    await supabase
      .from('workflow_events')
      .delete()
      .eq('is_processed', true)
      .lt('triggered_at', cutoffDate.toISOString())
    
    // Clean old rule execution logs
    await supabase
      .from('rule_execution_log')
      .delete()
      .lt('executed_at', cutoffDate.toISOString())
    
    // Clean expired automation alerts
    await supabase
      .from('automation_alerts')
      .delete()
      .in('status', ['resolved', 'dismissed'])
      .lt('created_at', cutoffDate.toISOString())
    
    // Clean expired recommendation cache
    await supabase
      .from('recommendation_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
    
    // Clean stale locks (older than timeout)
    const lockCutoff = new Date(Date.now() - this.LOCK_TIMEOUT_MS)
    await supabase
      .from('scheduled_jobs')
      .update({ 
        is_locked: false,
        locked_at: null,
        locked_by: null
      })
      .eq('is_locked', true)
      .lt('locked_at', lockCutoff.toISOString())
    
    console.log('Cleanup completed')
  }
  
  /**
   * Acquire distributed lock for job
   */
  private static async acquireLock(jobId: string): Promise<boolean> {
    const supabase = await createClient()
    
    try {
      // Attempt to acquire lock using optimistic locking
      const { data, error } = await supabase
        .from('scheduled_jobs')
        .update({
          is_locked: true,
          locked_at: new Date().toISOString(),
          locked_by: this.WORKER_ID
        })
        .eq('id', jobId)
        .eq('is_locked', false)
        .select()
        .single()
      
      return !error && data !== null
      
    } catch (error) {
      console.error('Error acquiring lock:', error)
      return false
    }
  }
  
  /**
   * Release lock for job
   */
  private static async releaseLock(jobId: string): Promise<void> {
    const supabase = await createClient()
    
    await supabase
      .from('scheduled_jobs')
      .update({
        is_locked: false,
        locked_at: null,
        locked_by: null
      })
      .eq('id', jobId)
      .eq('locked_by', this.WORKER_ID)
  }
  
  /**
   * Update job status after execution
   */
  private static async updateJobStatus(
    jobId: string,
    status: string,
    duration: number,
    error?: string
  ): Promise<void> {
    const supabase = await createClient()
    
    // Calculate next run time based on cron expression
    const { data: job } = await supabase
      .from('scheduled_jobs')
      .select('cron_expression')
      .eq('id', jobId)
      .single()
    
    const nextRunAt = job ? this.calculateNextRun(job.cron_expression) : null
    
    await supabase
      .from('scheduled_jobs')
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: status,
        last_run_duration_ms: duration,
        next_run_at: nextRunAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
  }
  
  /**
   * Calculate next run time from cron expression
   * Simplified implementation - in production use a library like node-cron
   */
  private static calculateNextRun(cronExpression: string): string {
    // Simple implementation for common patterns
    // In production, use a proper cron parser library
    
    const now = new Date()
    
    // Daily at specific time: "0 9 * * *" (9 AM daily)
    if (cronExpression.match(/^\d+ \d+ \* \* \*$/)) {
      const [minute, hour] = cronExpression.split(' ').map(Number)
      const next = new Date(now)
      next.setHours(hour, minute, 0, 0)
      
      if (next <= now) {
        next.setDate(next.getDate() + 1)
      }
      
      return next.toISOString()
    }
    
    // Hourly: "0 * * * *"
    if (cronExpression === '0 * * * *') {
      const next = new Date(now)
      next.setHours(next.getHours() + 1, 0, 0, 0)
      return next.toISOString()
    }
    
    // Every 15 minutes: "*/15 * * * *"
    if (cronExpression === '*/15 * * * *') {
      const next = new Date(now)
      next.setMinutes(Math.ceil(next.getMinutes() / 15) * 15, 0, 0)
      return next.toISOString()
    }
    
    // Default: 1 hour from now
    const next = new Date(now.getTime() + 60 * 60 * 1000)
    return next.toISOString()
  }
  
  /**
   * Create a new scheduled job
   */
  static async createScheduledJob(
    jobType: string,
    config: any,
    cronExpression: string
  ): Promise<string> {
    const supabase = await createClient()
    
    const nextRunAt = this.calculateNextRun(cronExpression)
    
    const { data, error } = await supabase
      .from('scheduled_jobs')
      .insert({
        job_type: jobType,
        config: config,
        cron_expression: cronExpression,
        is_active: true,
        next_run_at: nextRunAt
      })
      .select()
      .single()
    
    if (error) throw error
    
    return data.id
  }
  
  /**
   * Get job execution statistics
   */
  static async getJobStatistics(): Promise<any> {
    const supabase = await createClient()
    
    const { data: jobs } = await supabase
      .from('scheduled_jobs')
      .select('job_type, last_run_status, last_run_duration_ms, is_active')
    
    if (!jobs) return {}
    
    const stats: any = {
      total: jobs.length,
      active: jobs.filter(j => j.is_active).length,
      byType: {},
      byStatus: {
        success: 0,
        failed: 0,
        never_run: 0
      }
    }
    
    jobs.forEach(job => {
      // By type
      if (!stats.byType[job.job_type]) {
        stats.byType[job.job_type] = {
          count: 0,
          avg_duration_ms: 0,
          durations: []
        }
      }
      stats.byType[job.job_type].count++
      if (job.last_run_duration_ms) {
        stats.byType[job.job_type].durations.push(job.last_run_duration_ms)
      }
      
      // By status
      if (!job.last_run_status) {
        stats.byStatus.never_run++
      } else if (job.last_run_status === 'success') {
        stats.byStatus.success++
      } else {
        stats.byStatus.failed++
      }
    })
    
    // Calculate averages
    Object.keys(stats.byType).forEach(type => {
      const durations = stats.byType[type].durations
      if (durations.length > 0) {
        stats.byType[type].avg_duration_ms = Math.round(
          durations.reduce((a: number, b: number) => a + b, 0) / durations.length
        )
      }
      delete stats.byType[type].durations
    })
    
    return stats
  }
}
