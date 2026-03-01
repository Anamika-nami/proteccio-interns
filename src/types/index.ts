export type UserRole = 'admin' | 'intern' | 'public'

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
