import { createClient } from '@/lib/supabase/server'
import { AnalyticsService } from './analyticsService'
import { logActivity } from '@/lib/logger'

export class MetricsCalculationService {
  /**
   * Calculate and store performance metrics for all active interns
   */
  static async calculateAllMetrics(
    userId: string,
    periodType: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<{ success: boolean; processed: number; errors: number; error?: string }> {
    try {
      const supabase = await createClient()
      
      // Get all active interns
      const { data: activeInterns } = await supabase
        .from('intern_profiles')
        .select('id')
        .eq('status', 'ACTIVE')
        .is('deleted_at', null)

      if (!activeInterns || activeInterns.length === 0) {
        return { success: true, processed: 0, errors: 0 }
      }

      // Calculate date ranges based on period type
      const now = new Date()
      const periodStart = new Date()
      const periodEnd = new Date()

      switch (periodType) {
        case 'daily':
          periodStart.setDate(now.getDate() - 1)
          periodEnd.setDate(now.getDate())
          break
        case 'weekly':
          periodStart.setDate(now.getDate() - 7)
          periodEnd.setDate(now.getDate())
          break
        case 'monthly':
          periodStart.setMonth(now.getMonth() - 1)
          periodEnd.setMonth(now.getMonth())
          break
      }

      let processed = 0
      let errors = 0

      // Process each intern
      for (const intern of activeInterns) {
        try {
          const result = await AnalyticsService.calculatePerformanceMetrics(
            intern.id,
            periodType,
            periodStart.toISOString().split('T')[0],
            periodEnd.toISOString().split('T')[0]
          )
          
          if (result.success) {
            processed++
          } else {
            errors++
            console.error(`Failed to calculate metrics for intern ${intern.id}:`, result.error)
          }
        } catch (error) {
          errors++
          console.error(`Error processing intern ${intern.id}:`, error)
        }
      }

      // Log activity
      await logActivity({
        userId,
        action: 'calculate_all_metrics',
        entityType: 'analytics',
        entityId: 'system',
        metadata: { 
          period_type: periodType,
          processed,
          errors,
          total_interns: activeInterns.length
        },
        category: 'action'
      })

      return { success: true, processed, errors }
    } catch (error) {
      console.error('Error in calculateAllMetrics:', error)
      return { 
        success: false, 
        processed: 0, 
        errors: 0,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Run comprehensive analytics refresh
   */
  static async refreshAllAnalytics(
    userId: string
  ): Promise<{ success: boolean; results: any; error?: string }> {
    try {
      const results = {
        metrics_calculated: 0,
        insights_generated: 0,
        predictions_created: 0,
        errors: 0
      }

      // 1. Calculate performance metrics
      const metricsResult = await this.calculateAllMetrics(userId, 'weekly')
      results.metrics_calculated = metricsResult.processed
      results.errors += metricsResult.errors

      // 2. Generate productivity insights
      const insightsResult = await AnalyticsService.generateProductivityInsights(userId)
      if (insightsResult.success) {
        results.insights_generated = insightsResult.insights?.length || 0
      } else {
        results.errors++
      }

      // 3. Generate predictive indicators for all active interns
      const supabase = await createClient()
      const { data: activeInterns } = await supabase
        .from('intern_profiles')
        .select('id')
        .eq('status', 'ACTIVE')
        .is('deleted_at', null)

      if (activeInterns && activeInterns.length > 0) {
        for (const intern of activeInterns) {
          try {
            const predictionResult = await AnalyticsService.generatePredictiveIndicators(
              intern.id,
              userId
            )
            
            if (predictionResult.success) {
              results.predictions_created += predictionResult.indicators?.length || 0
            } else {
              results.errors++
            }
          } catch (error) {
            results.errors++
            console.error(`Error generating predictions for intern ${intern.id}:`, error)
          }
        }
      }

      // Log comprehensive refresh
      await logActivity({
        userId,
        action: 'refresh_all_analytics',
        entityType: 'analytics',
        entityId: 'system',
        metadata: results,
        category: 'action'
      })

      return { success: true, results }
    } catch (error) {
      console.error('Error in refreshAllAnalytics:', error)
      return { 
        success: false, 
        results: {},
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Clean up expired data
   */
  static async cleanupExpiredData(
    userId: string
  ): Promise<{ success: boolean; cleaned: number; error?: string }> {
    try {
      const supabase = await createClient()
      let totalCleaned = 0

      // Clean up expired predictive indicators
      const { count: expiredIndicators } = await supabase
        .from('predictive_indicators')
        .delete()
        .lt('expires_at', new Date().toISOString())

      totalCleaned += expiredIndicators || 0

      // Clean up expired alerts
      const { count: expiredAlerts } = await supabase
        .from('analytics_alerts')
        .delete()
        .lt('expires_at', new Date().toISOString())

      totalCleaned += expiredAlerts || 0

      // Clean up old performance metrics (keep last 6 months)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const { count: oldMetrics } = await supabase
        .from('intern_performance_metrics')
        .delete()
        .lt('period_start', sixMonthsAgo.toISOString().split('T')[0])

      totalCleaned += oldMetrics || 0

      // Log cleanup activity
      await logActivity({
        userId,
        action: 'cleanup_expired_analytics_data',
        entityType: 'analytics',
        entityId: 'system',
        metadata: { 
          cleaned_records: totalCleaned,
          expired_indicators: expiredIndicators || 0,
          expired_alerts: expiredAlerts || 0,
          old_metrics: oldMetrics || 0
        },
        category: 'action'
      })

      return { success: true, cleaned: totalCleaned }
    } catch (error) {
      console.error('Error in cleanupExpiredData:', error)
      return { 
        success: false, 
        cleaned: 0,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get analytics system health status
   */
  static async getSystemHealth(): Promise<{
    success: boolean
    health: {
      total_interns: number
      active_metrics: number
      active_alerts: number
      active_predictions: number
      last_calculation: string | null
      system_status: 'healthy' | 'warning' | 'error'
    }
    error?: string
  }> {
    try {
      const supabase = await createClient()

      // Get total interns
      const { count: totalInterns } = await supabase
        .from('intern_profiles')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null)

      // Get active metrics (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: activeMetrics } = await supabase
        .from('intern_performance_metrics')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())

      // Get active alerts
      const { count: activeAlerts } = await supabase
        .from('analytics_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())

      // Get active predictions
      const { count: activePredictions } = await supabase
        .from('predictive_indicators')
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', new Date().toISOString())

      // Get last calculation time
      const { data: lastMetric } = await supabase
        .from('intern_performance_metrics')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Determine system status
      let systemStatus: 'healthy' | 'warning' | 'error' = 'healthy'
      
      if (!lastMetric || new Date(lastMetric.created_at) < sevenDaysAgo) {
        systemStatus = 'warning'
      }
      
      if ((activeMetrics || 0) === 0 && (totalInterns || 0) > 0) {
        systemStatus = 'error'
      }

      const health = {
        total_interns: totalInterns || 0,
        active_metrics: activeMetrics || 0,
        active_alerts: activeAlerts || 0,
        active_predictions: activePredictions || 0,
        last_calculation: lastMetric?.created_at || null,
        system_status: systemStatus
      }

      return { success: true, health }
    } catch (error) {
      console.error('Error in getSystemHealth:', error)
      return { 
        success: false, 
        health: {
          total_interns: 0,
          active_metrics: 0,
          active_alerts: 0,
          active_predictions: 0,
          last_calculation: null,
          system_status: 'error'
        },
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}