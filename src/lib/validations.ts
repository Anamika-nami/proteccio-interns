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
