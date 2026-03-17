import { z } from 'zod'

export const internSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  cohort: z.string().min(1, 'Cohort is required'),
  bio: z.string().optional().nullable(),
  skills: z.array(z.string()).optional().default([]),
  user_id: z.string().uuid().optional().nullable(),
  approval_status: z.enum(['pending', 'active', 'rejected']).optional().default('pending'),
})

export const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(10, 'Message must be at least 10 characters'),
})

// ============================================================================
// PRODUCTIVITY & OPERATIONAL GOVERNANCE VALIDATIONS
// ============================================================================

export const attendanceCheckInSchema = z.object({
  intern_id: z.string().uuid('Invalid intern ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
})

export const attendanceCheckOutSchema = z.object({
  attendance_id: z.string().uuid('Invalid attendance ID'),
})

export const attendanceAdminUpdateSchema = z.object({
  attendance_id: z.string().uuid('Invalid attendance ID'),
  status: z.enum(['present', 'absent', 'half_day', 'leave']),
  admin_notes: z.string().optional(),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
})

export const workLogSchema = z.object({
  intern_id: z.string().uuid('Invalid intern ID'),
  task_id: z.string().uuid('Invalid task ID').optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  hours_spent: z.number().min(0, 'Hours must be positive').max(24, 'Hours cannot exceed 24'),
  challenges: z.string().optional().nullable(),
  progress_status: z.enum(['not_started', 'in_progress', 'completed']),
})

export const workLogReviewSchema = z.object({
  work_log_id: z.string().uuid('Invalid work log ID'),
  review_status: z.enum(['approved', 'revision_requested']),
  admin_comments: z.string().optional(),
})

export const taskEventSchema = z.object({
  task_id: z.string().uuid('Invalid task ID'),
  event_type: z.enum(['assigned', 'started', 'updated', 'completed', 'reviewed', 'reopened']),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const leaveRequestSchema = z.object({
  intern_id: z.string().uuid('Invalid intern ID'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid start date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid end date format'),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  document_url: z.string().url('Invalid document URL').optional().nullable(),
})

export const leaveReviewSchema = z.object({
  leave_request_id: z.string().uuid('Invalid leave request ID'),
  status: z.enum(['approved', 'rejected']),
  admin_comment: z.string().optional(),
})
// ============================================================================
// DAY 18 COLLABORATION FEATURES VALIDATIONS
// ============================================================================

export const collaborationThreadSchema = z.object({
  task_id: z.string().uuid('Invalid task ID'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  initial_comment: z.string().min(1, 'Initial comment is required').max(2000, 'Comment too long'),
  mentions: z.array(z.string().uuid()).max(5, 'Too many mentions').optional()
})

export const collaborationCommentSchema = z.object({
  thread_id: z.string().uuid('Invalid thread ID'),
  content: z.string().min(1, 'Content is required').max(2000, 'Comment too long'),
  parent_comment_id: z.string().uuid().optional(),
  mentions: z.array(z.string().uuid()).max(5, 'Too many mentions').optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string().url(),
    size: z.number().max(10 * 1024 * 1024, 'File too large'),
    type: z.string()
  })).max(3, 'Too many attachments').optional()
})

export const knowledgeResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  content_type: z.enum(['document', 'video', 'link', 'tutorial', 'reference']),
  file_url: z.string().url().optional(),
  external_url: z.string().url().optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category too long'),
  tags: z.array(z.string().max(50)).max(10, 'Too many tags'),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  estimated_duration_minutes: z.number().min(1).max(480).optional(), // Max 8 hours
  is_featured: z.boolean().default(false)
})

export const mentorshipConversationSchema = z.object({
  mentor_id: z.string().uuid('Invalid mentor ID'),
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject too long'),
  category: z.enum(['technical', 'career', 'task_help', 'general']),
  initial_message: z.string().min(1, 'Initial message is required').max(2000, 'Message too long'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal')
})

export const mentorshipMessageSchema = z.object({
  conversation_id: z.string().uuid('Invalid conversation ID'),
  content: z.string().min(1, 'Content is required').max(2000, 'Message too long'),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string().url(),
    size: z.number().max(10 * 1024 * 1024, 'File too large'),
    type: z.string()
  })).max(3, 'Too many attachments').optional()
})

export const learningLogSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(255, 'Topic too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category too long'),
  tools_used: z.array(z.string().max(50)).max(20, 'Too many tools'),
  time_spent_hours: z.number().min(0.1).max(24, 'Invalid time spent'),
  evidence_url: z.string().url().optional()
})

export const learningLogVerificationSchema = z.object({
  verification_status: z.enum(['verified', 'rejected']),
  verification_notes: z.string().max(500, 'Notes too long').optional()
})

export const progressUpdateSchema = z.object({
  status: z.enum(['started', 'completed']),
  progress_percentage: z.number().min(0).max(100),
  time_spent_minutes: z.number().min(0).max(480) // Max 8 hours
})