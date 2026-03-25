/**
 * WORKFLOW AUTOMATION TYPE DEFINITIONS
 */

// ============================================================================
// AUTOMATION RULES
// ============================================================================

export interface AutomationRule {
  id: string
  name: string
  description?: string
  rule_type: RuleType
  trigger_type: TriggerType
  schedule_cron?: string
  priority: number
  is_active: boolean
  is_deleted: boolean
  created_by: string
  created_at: string
  updated_at: string
  last_executed_at?: string
  execution_count: number
  
  // Relations
  rule_conditions?: RuleCondition[]
  rule_actions?: RuleAction[]
}

export type RuleType =
  | 'task_assignment'
  | 'notification'
  | 'status_update'
  | 'escalation'
  | 'milestone'
  | 'deadline'
  | 'document'
  | 'recommendation'

export type TriggerType =
  | 'event'      // Event-based trigger
  | 'schedule'   // Time-based trigger (cron)
  | 'condition'  // Condition-based trigger

// ============================================================================
// RULE CONDITIONS
// ============================================================================

export interface RuleCondition {
  id: string
  rule_id: string
  condition_group: number
  group_operator: 'AND' | 'OR'
  entity_type: EntityType
  field_name: string
  operator: ConditionOperator
  value: any  // JSONB - can be string, number, array, etc.
  sort_order: number
  created_at: string
}

export type EntityType =
  | 'intern'
  | 'task'
  | 'attendance'
  | 'worklog'
  | 'evaluation'
  | 'document'
  | 'leave'
  | 'badge'

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null'
  | 'between'
  | 'days_since'
  | 'days_until'

// ============================================================================
// RULE ACTIONS
// ============================================================================

export interface RuleAction {
  id: string
  rule_id: string
  action_type: ActionType
  config: Record<string, any>  // JSONB configuration
  sort_order: number
  max_retries: number
  retry_delay_seconds: number
  created_at: string
}

export type ActionType =
  | 'send_notification'
  | 'send_email'
  | 'assign_task'
  | 'update_status'
  | 'create_alert'
  | 'escalate'
  | 'generate_report'
  | 'update_field'
  | 'trigger_webhook'
  | 'create_document_request'
  | 'assign_badge'
  | 'schedule_evaluation'

// ============================================================================
// WORKFLOW EVENTS
// ============================================================================

export interface WorkflowEvent {
  id: string
  event_type: string
  event_category: EventCategory
  entity_type: string
  entity_id: string
  payload: Record<string, any>
  triggered_by?: string
  triggered_at: string
  is_processed: boolean
  processed_at?: string
  processing_attempts: number
  created_date: string
}

export type EventCategory =
  | 'intern_lifecycle'
  | 'task_management'
  | 'attendance'
  | 'document'
  | 'evaluation'
  | 'system'

// ============================================================================
// RULE EXECUTION
// ============================================================================

export interface RuleExecutionLog {
  id: string
  rule_id: string
  triggered_by_event_id?: string
  execution_context?: Record<string, any>
  status: ExecutionStatus
  conditions_met: boolean
  actions_executed: number
  actions_failed: number
  error_message?: string
  error_details?: Record<string, any>
  execution_time_ms: number
  executed_at: string
  executed_date: string
}

export type ExecutionStatus =
  | 'success'
  | 'partial_success'
  | 'failed'
  | 'skipped'

export interface RuleExecutionResult {
  ruleId: string
  status: ExecutionStatus
  conditionsMet: boolean
  actionsExecuted: number
  actionsFailed: number
  executionTimeMs: number
  errors: string[]
}

export interface ConditionEvaluationContext {
  event: WorkflowEvent | null
  entities: Record<string, any>
  computed: Record<string, any>
}

// ============================================================================
// SCHEDULED JOBS
// ============================================================================

export interface ScheduledJob {
  id: string
  job_type: JobType
  config: Record<string, any>
  cron_expression: string
  is_active: boolean
  last_run_at?: string
  last_run_status?: string
  last_run_duration_ms?: number
  next_run_at?: string
  is_locked: boolean
  locked_at?: string
  locked_by?: string
  created_at: string
  updated_at: string
}

export type JobType =
  | 'rule_execution'
  | 'deadline_scan'
  | 'milestone_check'
  | 'document_verification'
  | 'recommendation_update'
  | 'cleanup'

// ============================================================================
// DEADLINE TRACKING
// ============================================================================

export interface DeadlineTracking {
  id: string
  entity_type: DeadlineEntityType
  entity_id: string
  deadline_date: string
  deadline_time?: string
  status: DeadlineStatus
  warning_days_before: number
  alert_sent: boolean
  alert_sent_at?: string
  escalation_required: boolean
  escalated_at?: string
  created_at: string
  updated_at: string
}

export type DeadlineEntityType =
  | 'task'
  | 'document'
  | 'evaluation'
  | 'internship'
  | 'leave_request'

export type DeadlineStatus =
  | 'pending'
  | 'upcoming'
  | 'overdue'
  | 'completed'
  | 'cancelled'

// ============================================================================
// MILESTONE TRACKING
// ============================================================================

export interface MilestoneTracking {
  id: string
  intern_id: string
  milestone_type: MilestoneType
  milestone_date: string
  status: MilestoneStatus
  notification_sent: boolean
  notification_sent_at?: string
  created_at: string
  triggered_at?: string
}

export type MilestoneType =
  | 'tenure_25_percent'
  | 'tenure_50_percent'
  | 'tenure_75_percent'
  | 'tenure_90_percent'
  | 'completion_approaching'
  | 'completion_due'
  | 'extension_decision_due'

export type MilestoneStatus =
  | 'pending'
  | 'triggered'
  | 'completed'
  | 'skipped'

// ============================================================================
// DOCUMENT VERIFICATION
// ============================================================================

export interface DocumentVerificationTracking {
  id: string
  intern_id: string
  document_type: string
  is_mandatory: boolean
  status: DocumentVerificationStatus
  document_id?: string
  expiry_date?: string
  expiry_warning_days: number
  expiry_alert_sent: boolean
  missing_alert_sent: boolean
  missing_alert_sent_at?: string
  created_at: string
  updated_at: string
  verified_at?: string
  verified_by?: string
}

export type DocumentVerificationStatus =
  | 'missing'
  | 'submitted'
  | 'verified'
  | 'rejected'
  | 'expired'

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export interface RecommendationCache {
  id: string
  user_id: string
  user_type: 'intern' | 'admin'
  recommendation_type: RecommendationType
  recommendations: any[]
  confidence_score?: number
  computed_at: string
  expires_at: string
  is_valid: boolean
}

export type RecommendationType =
  | 'task_suggestion'
  | 'skill_suggestion'
  | 'learning_resource'
  | 'intern_ready_for_evaluation'
  | 'intern_at_risk'
  | 'low_performer'
  | 'high_performer'

export interface TaskRecommendation {
  task_id: string
  title: string
  description?: string
  priority: string
  due_date?: string
  match_score: number
  reason: string
  confidence: number
}

export interface SkillRecommendation {
  skill: string
  reason: string
  demand: number
  priority: 'high' | 'medium' | 'low'
  confidence: number
}

export interface ResourceRecommendation {
  resource_id: string
  title: string
  description?: string
  content_type: string
  difficulty_level: string
  match_score: number
  reason: string
  confidence: number
}

export interface InternRecommendation {
  intern_id: string
  full_name: string
  cohort: string
  score: number
  reasons?: string[]
  risk_factors?: string[]
  metrics: Record<string, any>
  recommendation?: string
  severity?: string
  confidence: number
}

// ============================================================================
// AUTOMATION ALERTS
// ============================================================================

export interface AutomationAlert {
  id: string
  alert_type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  target_user_id?: string
  target_intern_id?: string
  entity_type?: string
  entity_id?: string
  status: AlertStatus
  action_url?: string
  created_by_rule_id?: string
  created_at: string
  acknowledged_at?: string
  resolved_at?: string
  expires_at?: string
}

export type AlertType =
  | 'deadline_warning'
  | 'deadline_overdue'
  | 'milestone_reached'
  | 'document_missing'
  | 'document_expiring'
  | 'attendance_low'
  | 'performance_issue'
  | 'escalation'
  | 'review_ready'

export type AlertSeverity =
  | 'info'
  | 'warning'
  | 'error'
  | 'critical'

export type AlertStatus =
  | 'active'
  | 'acknowledged'
  | 'resolved'
  | 'dismissed'

// ============================================================================
// TASK ASSIGNMENT TEMPLATES
// ============================================================================

export interface TaskAssignmentTemplate {
  id: string
  name: string
  description?: string
  category: string
  task_title: string
  task_description?: string
  task_priority: string
  assignment_criteria?: Record<string, any>
  due_days_offset?: number
  is_recurring: boolean
  recurrence_pattern?: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

export interface CreateRuleDTO {
  name: string
  description?: string
  rule_type: RuleType
  trigger_type: TriggerType
  schedule_cron?: string
  priority?: number
  conditions: CreateConditionDTO[]
  actions: CreateActionDTO[]
}

export interface CreateConditionDTO {
  condition_group?: number
  group_operator?: 'AND' | 'OR'
  entity_type: EntityType
  field_name: string
  operator: ConditionOperator
  value: any
  sort_order?: number
}

export interface CreateActionDTO {
  action_type: ActionType
  config: Record<string, any>
  sort_order?: number
  max_retries?: number
  retry_delay_seconds?: number
}

export interface UpdateRuleDTO {
  name?: string
  description?: string
  priority?: number
  is_active?: boolean
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

export interface AutomationStatistics {
  rules: {
    total: number
    active: number
    byType: Record<string, number>
  }
  executions: {
    total: number
    success: number
    failed: number
    avgExecutionTimeMs: number
  }
  deadlines: {
    total: number
    upcoming: number
    overdue: number
    byType: Record<string, { upcoming: number; overdue: number }>
  }
  alerts: {
    total: number
    active: number
    bySeverity: Record<string, number>
  }
  jobs: {
    total: number
    active: number
    byType: Record<string, any>
  }
}
