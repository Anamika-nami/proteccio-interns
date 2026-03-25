/**
 * WORKFLOW AUTOMATION RULE ENGINE
 * 
 * Core engine that evaluates conditions and executes actions.
 * Implements the Interpreter Pattern for flexible rule evaluation.
 * 
 * Architecture:
 * - Rule Parser: Parses rule definitions
 * - Condition Evaluator: Evaluates complex conditions with AND/OR logic
 * - Action Executor: Executes actions based on rule outcomes
 * - Event Processor: Processes workflow events
 */

import { createClient } from '@/lib/supabase/server'
import type { 
  AutomationRule, 
  RuleCondition, 
  RuleAction, 
  WorkflowEvent,
  RuleExecutionResult,
  ConditionEvaluationContext
} from '@/types/automation'

export class RuleEngine {
  
  /**
   * Process a workflow event and execute matching rules
   */
  static async processEvent(eventId: string): Promise<void> {
    const supabase = await createClient()
    
    try {
      // 1. Fetch event
      const { data: event, error: eventError } = await supabase
        .from('workflow_events')
        .select('*')
        .eq('id', eventId)
        .single()
      
      if (eventError || !event) {
        throw new Error(`Event not found: ${eventId}`)
      }
      
      // 2. Find matching rules
      const { data: rules, error: rulesError } = await supabase
        .from('automation_rules')
        .select(`
          *,
          rule_conditions (*),
          rule_actions (*)
        `)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .eq('trigger_type', 'event')
        .order('priority', { ascending: false })
      
      if (rulesError) throw rulesError
      
      // 3. Execute matching rules
      for (const rule of rules || []) {
        await this.executeRule(rule, event)
      }
      
      // 4. Mark event as processed
      await supabase
        .from('workflow_events')
        .update({ 
          is_processed: true, 
          processed_at: new Date().toISOString() 
        })
        .eq('id', eventId)
        
    } catch (error) {
      console.error('Error processing event:', error)
      
      // Increment processing attempts
      await supabase
        .from('workflow_events')
        .update({ 
          processing_attempts: supabase.rpc('increment', { row_id: eventId })
        })
        .eq('id', eventId)
      
      throw error
    }
  }
  
  /**
   * Execute a single rule
   */
  static async executeRule(
    rule: AutomationRule, 
    event?: WorkflowEvent
  ): Promise<RuleExecutionResult> {
    const supabase = await createClient()
    const startTime = Date.now()
    
    const result: RuleExecutionResult = {
      ruleId: rule.id,
      status: 'success',
      conditionsMet: false,
      actionsExecuted: 0,
      actionsFailed: 0,
      executionTimeMs: 0,
      errors: []
    }
    
    try {
      // 1. Build evaluation context
      const context = await this.buildEvaluationContext(rule, event)
      
      // 2. Evaluate conditions
      result.conditionsMet = await this.evaluateConditions(
        rule.rule_conditions || [],
        context
      )
      
      // 3. Execute actions if conditions met
      if (result.conditionsMet) {
        const actionResults = await this.executeActions(
          rule.rule_actions || [],
          context
        )
        
        result.actionsExecuted = actionResults.filter(r => r.success).length
        result.actionsFailed = actionResults.filter(r => !r.success).length
        result.errors = actionResults
          .filter(r => !r.success)
          .map(r => r.error || 'Unknown error')
      } else {
        result.status = 'skipped'
      }
      
      // 4. Update rule execution stats
      await supabase
        .from('automation_rules')
        .update({
          last_executed_at: new Date().toISOString(),
          execution_count: supabase.rpc('increment', { row_id: rule.id })
        })
        .eq('id', rule.id)
      
    } catch (error) {
      result.status = 'failed'
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      result.executionTimeMs = Date.now() - startTime
      
      // 5. Log execution
      await this.logExecution(rule.id, result, event?.id)
    }
    
    return result
  }
  
  /**
   * Build evaluation context from rule and event
   */
  private static async buildEvaluationContext(
    rule: AutomationRule,
    event?: WorkflowEvent
  ): Promise<ConditionEvaluationContext> {
    const supabase = await createClient()
    const context: ConditionEvaluationContext = {
      event: event || null,
      entities: {},
      computed: {}
    }
    
    // If event provided, fetch related entity data
    if (event) {
      const entityData = await this.fetchEntityData(
        event.entity_type,
        event.entity_id
      )
      context.entities[event.entity_type] = entityData
    }
    
    // Fetch additional entities based on rule conditions
    const conditions = rule.rule_conditions || []
    const entityTypes = [...new Set(conditions.map(c => c.entity_type))]
    
    for (const entityType of entityTypes) {
      if (!context.entities[entityType]) {
        // For non-event triggered rules, we need to fetch all matching entities
        const entities = await this.fetchEntitiesForEvaluation(entityType)
        context.entities[entityType] = entities
      }
    }
    
    return context
  }
  
  /**
   * Fetch entity data by type and ID
   */
  private static async fetchEntityData(
    entityType: string,
    entityId: string
  ): Promise<any> {
    const supabase = await createClient()
    
    const tableMap: Record<string, string> = {
      'intern': 'intern_profiles',
      'task': 'tasks',
      'attendance': 'attendance',
      'worklog': 'work_logs',
      'evaluation': 'intern_evaluations',
      'document': 'intern_documents',
      'leave': 'leave_requests',
      'badge': 'intern_badges'
    }
    
    const tableName = tableMap[entityType]
    if (!tableName) {
      throw new Error(`Unknown entity type: ${entityType}`)
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', entityId)
      .single()
    
    if (error) throw error
    return data
  }
  
  /**
   * Fetch entities for evaluation (for condition-based triggers)
   */
  private static async fetchEntitiesForEvaluation(
    entityType: string
  ): Promise<any[]> {
    const supabase = await createClient()
    
    const tableMap: Record<string, string> = {
      'intern': 'intern_profiles',
      'task': 'tasks',
      'attendance': 'attendance',
      'worklog': 'work_logs',
      'evaluation': 'intern_evaluations',
      'document': 'intern_documents',
      'leave': 'leave_requests',
      'badge': 'intern_badges'
    }
    
    const tableName = tableMap[entityType]
    if (!tableName) return []
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1000)  // Safety limit
    
    if (error) {
      console.error(`Error fetching ${entityType}:`, error)
      return []
    }
    
    return data || []
  }
  
  /**
   * Evaluate rule conditions with AND/OR logic
   */
  private static async evaluateConditions(
    conditions: RuleCondition[],
    context: ConditionEvaluationContext
  ): Promise<boolean> {
    if (conditions.length === 0) return true
    
    // Group conditions by condition_group
    const groups = conditions.reduce((acc, condition) => {
      const group = condition.condition_group || 1
      if (!acc[group]) acc[group] = []
      acc[group].push(condition)
      return acc
    }, {} as Record<number, RuleCondition[]>)
    
    // Evaluate each group
    const groupResults: boolean[] = []
    
    for (const [groupId, groupConditions] of Object.entries(groups)) {
      const operator = groupConditions[0]?.group_operator || 'AND'
      
      // Sort by sort_order
      groupConditions.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      
      // Evaluate conditions in group
      const conditionResults = await Promise.all(
        groupConditions.map(c => this.evaluateCondition(c, context))
      )
      
      // Apply group operator
      const groupResult = operator === 'AND'
        ? conditionResults.every(r => r)
        : conditionResults.some(r => r)
      
      groupResults.push(groupResult)
    }
    
    // All groups must be true (groups are AND-ed together)
    return groupResults.every(r => r)
  }
  
  /**
   * Evaluate a single condition
   */
  private static async evaluateCondition(
    condition: RuleCondition,
    context: ConditionEvaluationContext
  ): Promise<boolean> {
    try {
      // Get entity data
      const entityData = context.entities[condition.entity_type]
      if (!entityData) return false
      
      // Handle array of entities (for condition-based triggers)
      const entities = Array.isArray(entityData) ? entityData : [entityData]
      
      // Check if ANY entity matches (for bulk evaluation)
      return entities.some(entity => 
        this.evaluateSingleEntityCondition(condition, entity)
      )
      
    } catch (error) {
      console.error('Error evaluating condition:', error)
      return false
    }
  }
  
  /**
   * Evaluate condition against a single entity
   */
  private static evaluateSingleEntityCondition(
    condition: RuleCondition,
    entity: any
  ): boolean {
    const fieldValue = this.getFieldValue(entity, condition.field_name)
    const conditionValue = condition.value
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue
      
      case 'not_equals':
        return fieldValue !== conditionValue
      
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue)
      
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue)
      
      case 'greater_or_equal':
        return Number(fieldValue) >= Number(conditionValue)
      
      case 'less_or_equal':
        return Number(fieldValue) <= Number(conditionValue)
      
      case 'contains':
        return String(fieldValue).includes(String(conditionValue))
      
      case 'not_contains':
        return !String(fieldValue).includes(String(conditionValue))
      
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue)
      
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue)
      
      case 'is_null':
        return fieldValue === null || fieldValue === undefined
      
      case 'is_not_null':
        return fieldValue !== null && fieldValue !== undefined
      
      case 'between':
        if (Array.isArray(conditionValue) && conditionValue.length === 2) {
          const numValue = Number(fieldValue)
          return numValue >= conditionValue[0] && numValue <= conditionValue[1]
        }
        return false
      
      case 'days_since':
        if (fieldValue) {
          const date = new Date(fieldValue)
          const daysSince = Math.floor(
            (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
          )
          return daysSince >= Number(conditionValue)
        }
        return false
      
      case 'days_until':
        if (fieldValue) {
          const date = new Date(fieldValue)
          const daysUntil = Math.floor(
            (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          return daysUntil <= Number(conditionValue)
        }
        return false
      
      default:
        console.warn(`Unknown operator: ${condition.operator}`)
        return false
    }
  }
  
  /**
   * Get field value from entity (supports nested fields)
   */
  private static getFieldValue(entity: any, fieldPath: string): any {
    const parts = fieldPath.split('.')
    let value = entity
    
    for (const part of parts) {
      if (value === null || value === undefined) return null
      value = value[part]
    }
    
    return value
  }
  
  /**
   * Execute rule actions
   */
  private static async executeActions(
    actions: RuleAction[],
    context: ConditionEvaluationContext
  ): Promise<Array<{ success: boolean; error?: string }>> {
    // Sort by sort_order
    const sortedActions = [...actions].sort(
      (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
    )
    
    const results: Array<{ success: boolean; error?: string }> = []
    
    for (const action of sortedActions) {
      const result = await this.executeAction(action, context)
      results.push(result)
      
      // If action failed and has retries, attempt retry
      if (!result.success && (action.max_retries || 0) > 0) {
        for (let i = 0; i < (action.max_retries || 0); i++) {
          await this.delay((action.retry_delay_seconds || 60) * 1000)
          const retryResult = await this.executeAction(action, context)
          if (retryResult.success) {
            results[results.length - 1] = retryResult
            break
          }
        }
      }
    }
    
    return results
  }
  
  /**
   * Execute a single action
   */
  private static async executeAction(
    action: RuleAction,
    context: ConditionEvaluationContext
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (action.action_type) {
        case 'send_notification':
          return await this.actionSendNotification(action.config, context)
        
        case 'send_email':
          return await this.actionSendEmail(action.config, context)
        
        case 'assign_task':
          return await this.actionAssignTask(action.config, context)
        
        case 'update_status':
          return await this.actionUpdateStatus(action.config, context)
        
        case 'create_alert':
          return await this.actionCreateAlert(action.config, context)
        
        case 'escalate':
          return await this.actionEscalate(action.config, context)
        
        case 'update_field':
          return await this.actionUpdateField(action.config, context)
        
        case 'assign_badge':
          return await this.actionAssignBadge(action.config, context)
        
        case 'schedule_evaluation':
          return await this.actionScheduleEvaluation(action.config, context)
        
        default:
          return { 
            success: false, 
            error: `Unknown action type: ${action.action_type}` 
          }
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
  
  /**
   * ACTION IMPLEMENTATIONS
   */
  
  private static async actionSendNotification(
    config: any,
    context: ConditionEvaluationContext
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: config.user_id || context.event?.triggered_by,
        type: config.notification_type || 'system',
        message: config.message,
        link: config.link || null
      })
    
    return { success: !error, error: error?.message }
  }
  
  private static async actionSendEmail(
    config: any,
    context: ConditionEvaluationContext
  ): Promise<{ success: boolean; error?: string }> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log('Email action:', config)
    return { success: true }
  }
  
  private static async actionAssignTask(
    config: any,
    context: ConditionEvaluationContext
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    
    // Check for duplicate assignment
    const { data: existing } = await supabase
      .from('tasks')
      .select('id')
      .eq('title', config.task_title)
      .eq('assigned_to', config.assigned_to)
      .eq('status', 'todo')
      .single()
    
    if (existing) {
      return { success: true }  // Already assigned, idempotent
    }
    
    const dueDate = config.due_days_offset
      ? new Date(Date.now() + config.due_days_offset * 24 * 60 * 60 * 1000)
      : null
    
    const { error } = await supabase
      .from('tasks')
      .insert({
        title: config.task_title,
        description: config.task_description,
        assigned_to: config.assigned_to,
        priority: config.priority || 'normal',
        status: 'todo',
        due_date: dueDate?.toISOString().split('T')[0]
      })
    
    return { success: !error, error: error?.message }
  }
  
  private static async actionUpdateStatus(
    config: any,
    context: ConditionEvaluationContext
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    
    const entityType = config.entity_type || context.event?.entity_type
    const entityId = config.entity_id || context.event?.entity_id
    
    if (!entityType || !entityId) {
      return { success: false, error: 'Missing entity information' }
    }
    
    const tableMap: Record<string, string> = {
      'intern': 'intern_profiles',
      'task': 'tasks',
      'leave': 'leave_requests'
    }
    
    const tableName = tableMap[entityType]
    if (!tableName) {
      return { success: false, error: `Unknown entity type: ${entityType}` }
    }
    
    const { error } = await supabase
      .from(tableName)
      .update({ status: config.status })
      .eq('id', entityId)
    
    return { success: !error, error: error?.message }
  }
  
  private static async actionCreateAlert(
    config: any,
    context: ConditionEvaluationContext
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('automation_alerts')
      .insert({
        alert_type: config.alert_type,
        severity: config.severity || 'info',
        title: config.title,
        message: config.message,
        target_user_id: config.target_user_id,
        target_intern_id: config.target_intern_id,
        entity_type: config.entity_type,
        entity_id: config.entity_id,
        action_url: config.action_url,
        expires_at: config.expires_at
      })
    
    return { success: !error, error: error?.message }
  }
  
  private static async actionEscalate(
    config: any,
    context: ConditionEvaluationContext
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    
    // Create high-priority alert for admin
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
    
    if (!admins || admins.length === 0) {
      return { success: false, error: 'No admins found' }
    }
    
    const alerts = admins.map(admin => ({
      alert_type: 'escalation',
      severity: 'critical',
      title: config.title || 'Escalation Required',
      message: config.message,
      target_user_id: admin.id,
      entity_type: config.entity_type,
      entity_id: config.entity_id,
      action_url: config.action_url
    }))
    
    const { error } = await supabase
      .from('automation_alerts')
      .insert(alerts)
    
    return { success: !error, error: error?.message }
  }
  
  private static async actionUpdateField(
    config: any,
    context: ConditionEvaluationContext
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    
    const tableMap: Record<string, string> = {
      'intern': 'intern_profiles',
      'task': 'tasks',
      'worklog': 'work_logs'
    }
    
    const tableName = tableMap[config.entity_type]
    if (!tableName) {
      return { success: false, error: `Unknown entity type: ${config.entity_type}` }
    }
    
    const { error } = await supabase
      .from(tableName)
      .update({ [config.field]: config.value })
      .eq('id', config.entity_id)
    
    return { success: !error, error: error?.message }
  }
  
  private static async actionAssignBadge(
    config: any,
    context: ConditionEvaluationContext
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    
    // Check if badge already assigned
    const { data: existing } = await supabase
      .from('intern_badges')
      .select('id')
      .eq('intern_id', config.intern_id)
      .eq('badge_id', config.badge_id)
      .single()
    
    if (existing) {
      return { success: true }  // Already assigned
    }
    
    const { error } = await supabase
      .from('intern_badges')
      .insert({
        intern_id: config.intern_id,
        badge_id: config.badge_id,
        awarded_by: config.awarded_by || null
      })
    
    return { success: !error, error: error?.message }
  }
  
  private static async actionScheduleEvaluation(
    config: any,
    context: ConditionEvaluationContext
  ): Promise<{ success: boolean; error?: string }> {
    // Create a notification for admin to schedule evaluation
    return await this.actionSendNotification({
      user_id: config.admin_id,
      notification_type: 'evaluation_due',
      message: `Evaluation due for intern: ${config.intern_name}`,
      link: `/admin/evaluations/${config.intern_id}`
    }, context)
  }
  
  /**
   * Log rule execution
   */
  private static async logExecution(
    ruleId: string,
    result: RuleExecutionResult,
    eventId?: string
  ): Promise<void> {
    const supabase = await createClient()
    
    await supabase
      .from('rule_execution_log')
      .insert({
        rule_id: ruleId,
        triggered_by_event_id: eventId || null,
        status: result.status,
        conditions_met: result.conditionsMet,
        actions_executed: result.actionsExecuted,
        actions_failed: result.actionsFailed,
        error_message: result.errors.join('; ') || null,
        execution_time_ms: result.executionTimeMs
      })
  }
  
  /**
   * Utility: Delay execution
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
