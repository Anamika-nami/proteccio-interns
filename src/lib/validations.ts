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
