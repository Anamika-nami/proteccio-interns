import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi } from 'vitest'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    then: vi.fn()
  }))
}

// Mock config
const mockConfig = {
  features: {
    attendance: true,
    workLogs: true,
    leaveRequests: true,
    analytics: true,
    notifications: true
  },
  ui: {
    theme: 'light',
    compactMode: false
  }
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialUser?: any
  initialConfig?: any
}

const AllTheProviders = ({ children }: any) => {
  return <div>{children}</div>
}

const customRender = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  return render(ui, {
    wrapper: AllTheProviders,
    ...options,
  })
}

// Mock data generators
export const mockIntern = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  full_name: 'John Doe',
  email: 'john.doe@example.com',
  cohort: 'Spring 2024',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z'
}

export const mockAdmin = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'admin@example.com',
  role: 'admin'
}

export const mockTask = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  title: 'Test Task',
  description: 'Test task description',
  status: 'todo',
  assigned_to: mockIntern.id,
  created_at: '2024-01-01T00:00:00Z'
}

export const mockAttendance = {
  id: '123e4567-e89b-12d3-a456-426614174003',
  intern_id: mockIntern.id,
  date: '2024-01-01',
  check_in_time: '2024-01-01T09:00:00Z',
  check_out_time: '2024-01-01T17:00:00Z',
  status: 'present',
  working_hours: 8.0
}

export const mockWorkLog = {
  id: '123e4567-e89b-12d3-a456-426614174004',
  intern_id: mockIntern.id,
  task_id: mockTask.id,
  date: '2024-01-01',
  description: 'Worked on test task',
  hours_spent: 4.0,
  progress_status: 'in_progress'
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
export { mockSupabaseClient }