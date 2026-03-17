// Day 18 Collaboration Feature Types
import type { Task } from './index'
export interface CollaborationThread {
  id: string
  task_id: string
  title: string
  status: 'open' | 'resolved' | 'archived'
  created_by: string
  resolved_by?: string
  resolved_at?: string
  created_at: string
  updated_at: string
  
  // Joined data
  created_by_profile?: {
    id: string
    email: string
  }
  resolved_by_profile?: {
    id: string
    email: string
  }
  comment_count?: number
  has_unread?: boolean
  latest_comment?: {
    created_at: string
    author_id: string
    content: string
  }
}

export interface CollaborationComment {
  id: string
  thread_id: string
  parent_comment_id?: string
  content: string
  author_id: string
  mentions: string[]
  attachments: Attachment[]
  is_edited: boolean
  edited_at?: string
  created_at: string
  
  // Joined data
  author?: {
    id: string
    email: string
  }
  replies?: CollaborationComment[]
}

export interface KnowledgeResource {
  id: string
  title: string
  description?: string
  content_type: 'document' | 'video' | 'link' | 'tutorial' | 'reference'
  file_url?: string
  external_url?: string
  category: string
  tags: string[]
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration_minutes?: number
  is_featured: boolean
  created_by: string
  created_at: string
  updated_at: string
  
  // User-specific data
  is_bookmarked?: boolean
  user_progress?: KnowledgeProgress
  
  // Joined data
  created_by_profile?: {
    id: string
    email: string
  }
}

export interface KnowledgeBookmark {
  id: string
  user_id: string
  resource_id: string
  created_at: string
}

export interface KnowledgeProgress {
  id: string
  user_id: string
  resource_id: string
  status: 'started' | 'completed'
  progress_percentage: number
  time_spent_minutes: number
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface MentorshipConversation {
  id: string
  intern_id: string
  mentor_id: string
  subject: string
  category: 'technical' | 'career' | 'task_help' | 'general'
  status: 'open' | 'resolved' | 'archived'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  resolved_at?: string
  created_at: string
  updated_at: string
  
  // Joined data
  intern?: {
    id: string
    full_name: string
    cohort: string
  }
  mentor?: {
    id: string
    email: string
  }
  message_count?: number
  unread_count?: number
  latest_message?: {
    created_at: string
    sender_id: string
    content: string
  }
}

export interface MentorshipMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  attachments: Attachment[]
  is_edited: boolean
  edited_at?: string
  created_at: string
  
  // Joined data
  sender?: {
    id: string
    email: string
  }
}

export interface LearningLog {
  id: string
  intern_id: string
  topic: string
  description?: string
  category: string
  tools_used: string[]
  time_spent_hours: number
  evidence_url?: string
  verification_status: 'pending' | 'verified' | 'rejected'
  verified_by?: string
  verified_at?: string
  verification_notes?: string
  created_at: string
  updated_at: string
  
  // Joined data
  intern?: {
    id: string
    full_name: string
    cohort: string
  }
  verified_by_user?: {
    id: string
    email: string
  }
}

export interface DashboardInsight {
  id: string
  user_id: string
  insight_type: string
  title: string
  description?: string
  data: Record<string, any>
  priority: number
  is_dismissed: boolean
  expires_at?: string
  created_at: string
}

export interface DashboardData {
  insights: DashboardInsight[]
  recommendations: KnowledgeResource[]
  stats: {
    tasks_today: number
    pending_tasks: number
    attendance_streak: number
    learning_hours_week: number
    unread_notifications: number
  }
  todaysTasks: Task[]
  pendingTasks: Task[]
  attendanceStreak?: number
}

export interface Attachment {
  id: string
  filename: string
  url: string
  size: number
  type: string
}

// DTO Types for API requests
export interface CreateThreadDTO {
  task_id: string
  title: string
  initial_comment: string
  mentions?: string[]
}

export interface CreateCommentDTO {
  thread_id: string
  content: string
  parent_comment_id?: string
  mentions?: string[]
  attachments?: Attachment[]
}

export interface CreateKnowledgeResourceDTO {
  title: string
  description?: string
  content_type: 'document' | 'video' | 'link' | 'tutorial' | 'reference'
  file_url?: string
  external_url?: string
  category: string
  tags: string[]
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration_minutes?: number
  is_featured?: boolean
}

export interface CreateMentorshipConversationDTO {
  mentor_id: string
  subject: string
  category: 'technical' | 'career' | 'task_help' | 'general'
  initial_message: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export interface CreateLearningLogDTO {
  topic: string
  description?: string
  category: string
  tools_used: string[]
  time_spent_hours: number
  evidence_url?: string
}

export interface ProgressUpdate {
  status: 'started' | 'completed'
  progress_percentage: number
  time_spent_minutes: number
}