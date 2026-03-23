export type UserRole = 'admin' | 'intern' | 'public'

// Re-export collaboration types
export * from './collaboration'

// Re-export analytics types
export * from './analytics'

export type Intern = {
  id: string
  full_name: string
  cohort: string
  bio: string | null
  skills: string[]
  approval_status: 'pending' | 'active' | 'rejected'
  is_active: boolean
  user_id: string | null
  deleted_at: string | null
  deleted_by: string | null
  created_at: string
}

export type Project = {
  id: string
  title: string
  description: string | null
  tech_stack: string[]
  status: string
  live_url: string | null
  repo_url: string | null
  deleted_at: string | null
  created_at: string
}

export type Task = {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  assigned_to: string | null
  due_date: string | null
  created_by: string | null
  created_at: string
  priority?: string
  collaboration_count?: number
  unread_comments?: number
}

export type AppConfig = {
  key: string
  value: string
  type: 'string' | 'boolean' | 'color' | 'json'
  label: string
}

export type FormField = {
  id: string
  form_name: string
  field_key: string
  field_label: string
  field_type: string
  is_required: boolean
  is_active: boolean
  visibility: 'public' | 'intern_only' | 'admin_only' | 'masked'
  classification: 'public' | 'internal' | 'confidential' | 'sensitive'
  sort_order: number
  options: string[] | null
}

export type Notification = {
  id: string
  user_id: string
  type: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export type ActivityLog = {
  id: string
  user_id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown> | null
  log_category: 'action' | 'data_view' | 'data_export' | 'config_change'
  created_at: string
}

export type Permission = {
  id: string
  role: string
  resource: string
  can_create: boolean
  can_read: boolean
  can_update: boolean
  can_delete: boolean
  access_level: string | null
  field_restrictions: string[] | null
}

export type WorkflowRule = {
  id: string
  name: string
  trigger_type: string
  condition: {
    field: string
    operator: string
    value: unknown
  }
  action: {
    type: string
    message: string
  }
  is_active: boolean
}

export type UserPreferences = {
  id?: string
  user_id?: string
  theme: 'dark' | 'light'
  layout: 'grid' | 'list'
  updated_at?: string
}

// ============================================================================
// PRODUCTIVITY & OPERATIONAL GOVERNANCE TYPES
// ============================================================================

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave'

export type Attendance = {
  id: string
  intern_id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  status: AttendanceStatus
  working_hours: number
  marked_by_admin: boolean
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export type WorkLogProgressStatus = 'not_started' | 'in_progress' | 'completed'
export type WorkLogReviewStatus = 'pending' | 'approved' | 'revision_requested'

export type WorkLog = {
  id: string
  intern_id: string
  task_id: string | null
  date: string
  description: string
  hours_spent: number
  challenges: string | null
  progress_status: WorkLogProgressStatus
  submitted_at: string
  review_status: WorkLogReviewStatus
  admin_comments: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type TaskEventType = 'assigned' | 'started' | 'updated' | 'completed' | 'reviewed' | 'reopened'

export type TaskEvent = {
  id: string
  task_id: string
  event_type: TaskEventType
  description: string | null
  metadata: Record<string, unknown> | null
  created_by: string | null
  timestamp: string
}

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected'

export type LeaveRequest = {
  id: string
  intern_id: string
  start_date: string
  end_date: string
  reason: string
  document_url: string | null
  status: LeaveRequestStatus
  admin_comment: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type WeeklySummary = {
  id: string
  intern_id: string
  week_start_date: string
  week_end_date: string
  tasks_completed: number
  tasks_pending: number
  attendance_percentage: number
  work_logs_submitted: number
  work_logs_expected: number
  total_hours_logged: number
  admin_remarks: string | null
  generated_at: string
  generated_by: string | null
}

export type AttendanceSummary = {
  intern_id: string
  full_name: string
  cohort: string
  present_days: number
  absent_days: number
  half_days: number
  leave_days: number
  total_days: number
  attendance_percentage: number
  total_hours_worked: number
  avg_hours_per_day: number
}

export type TaskMetrics = {
  intern_id: string
  full_name: string
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  pending_tasks: number
  completion_rate: number
  avg_completion_hours: number
}

export type ProductivityDashboard = {
  intern_id: string
  full_name: string
  cohort: string
  is_active: boolean
  attendance_percentage: number
  total_hours_worked: number
  total_tasks: number
  completed_tasks: number
  task_completion_rate: number
  avg_task_completion_hours: number
  work_logs_submitted: number
  work_logs_approved: number
  total_hours_logged: number
}

// ============================================================================
// DAY 17: INTERN LIFECYCLE & EVALUATION TYPES
// ============================================================================

export type InternStatus = 'ACTIVE' | 'COMPLETION_REVIEW' | 'COMPLETED' | 'EXTENDED' | 'TERMINATED'

export type InternEvaluation = {
  id: string
  intern_id: string
  evaluator_id: string
  task_quality_score: number
  consistency_score: number
  attendance_score: number
  communication_score: number
  learning_score: number
  overall_score: number
  feedback: string | null
  created_at: string
}

export type CreateEvaluationDTO = {
  intern_id: string
  task_quality_score: number
  consistency_score: number
  attendance_score: number
  communication_score: number
  learning_score: number
  feedback?: string
}

export type InternFeedback = {
  id: string
  intern_id: string
  learning_experience_rating: number
  task_difficulty_rating: number
  mentorship_rating: number
  program_structure_rating: number
  suggestions: string | null
  created_at: string
}

export type CreateFeedbackDTO = {
  intern_id: string
  learning_experience_rating: number
  task_difficulty_rating: number
  mentorship_rating: number
  program_structure_rating: number
  suggestions?: string
}

export type Badge = {
  id: string
  name: string
  description: string
  icon: string | null
  criteria: Record<string, unknown>
  created_at: string
}

export type InternBadge = {
  id: string
  intern_id: string
  badge_id: string
  earned_at: string
}

export type InternBadgeWithDetails = InternBadge & {
  badge: Badge
}

export type CompletionReviewIntern = {
  id: string
  full_name: string
  cohort: string
  status: InternStatus
  has_evaluation: boolean
  evaluation_score: number | null
  completed_tasks: number
  total_tasks: number
  attendance_percentage: number
  badges_earned: number
}

export type InternReport = {
  intern: {
    id: string
    full_name: string
    cohort: string
    bio: string | null
    skills: string[]
    status: InternStatus
    joined_at: string
  }
  attendance: {
    present_days: number
    absent_days: number
    half_days: number
    leave_days: number
    total_days: number
    attendance_percentage: number
    total_hours_worked: number
  }
  tasks: {
    total_tasks: number
    completed_tasks: number
    in_progress_tasks: number
    pending_tasks: number
    completion_rate: number
  }
  skills: {
    initial_skills: string[]
    current_skills: string[]
    skills_added: string[]
  }
  evaluations: InternEvaluation[]
  badges: InternBadgeWithDetails[]
  feedback: InternFeedback | null
}

export type FeedbackAnalytics = {
  total_responses: number
  average_ratings: {
    learning_experience: number
    task_difficulty: number
    mentorship: number
    program_structure: number
  }
  rating_distribution: {
    rating: number
    count: number
  }[]
  recent_suggestions: {
    intern_name: string
    suggestion: string
    created_at: string
  }[]
}

export type CertificateData = {
  intern_name: string
  role: string
  organization: string
  duration: string
  completion_date: string
  certificate_id: string
}
