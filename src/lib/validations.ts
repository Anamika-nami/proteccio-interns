import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  body: z.string().min(20, 'Message must be at least 20 characters').max(2000),
})

export const internSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  cohort: z.string().min(4, 'Cohort is required'),
  user_id: z.string().uuid('Invalid user ID'),
  bio: z.string().max(500).optional(),
  skills: z.array(z.string()).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
})

export const projectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(1000).optional(),
  tech_stack: z.array(z.string()).optional(),
  repo_url: z.string().url().optional().or(z.literal('')),
  live_url: z.string().url().optional().or(z.literal('')),
  created_by: z.string().uuid().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type ContactInput = z.infer<typeof contactSchema>
export type InternInput = z.infer<typeof internSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type LoginInput = z.infer<typeof loginSchema>
