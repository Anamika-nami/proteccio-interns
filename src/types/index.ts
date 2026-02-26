export type Intern = {
  id: string
  full_name: string
  bio: string | null
  skills: string[]
  cohort: string
  approval_status: string
  is_active: boolean
  user_id: string | null
  deleted_at: string | null
  deleted_by: string | null
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
}

export type Task = {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  assigned_to: string | null
  due_date: string | null
}

export type Config = {
  app_name: string
  primary_color: string
  secondary_color: string
  feature_interns: string
  feature_projects: string
  feature_tasks: string
  dashboard_layout: string
}

export type UserPreferences = {
  theme: 'dark' | 'light'
  layout: 'grid' | 'list'
}

export type FormField = {
  id: string
  field_key: string
  field_label: string
  field_type: 'text' | 'email' | 'textarea' | 'dropdown' | 'date'
  is_required: boolean
  is_active: boolean
  visibility: 'public' | 'intern_only' | 'admin_only' | 'masked'
  sort_order: number
  options: string[] | null
}

export type ConsentLog = {
  id: string
  user_id: string
  consented_at: string
  version: string
}
