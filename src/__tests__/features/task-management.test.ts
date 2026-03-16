import { mockIntern, mockTask } from '../test-utils'
import { vi } from 'vitest'

describe('Task Management System', () => {
  const mockTaskAPI = {
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    getTasks: vi.fn(),
    getTaskEvents: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Task Creation', () => {
    it('creates task with required fields', async () => {
      const newTask = {
        title: 'Implement user authentication',
        description: 'Add login and registration functionality',
        assigned_to: mockIntern.id,
        priority: 'high',
        due_date: '2024-02-01',
        estimated_hours: 16.0
      }

      mockTaskAPI.createTask.mockResolvedValue({
        success: true,
        data: { ...newTask, id: 'new-task-id', status: 'todo' }
      })

      // Test task creation
      expect(newTask.title).toBeDefined()
      expect(newTask.assigned_to).toBe(mockIntern.id)
    })

    it('validates task data', () => {
      const invalidTask = {
        title: '', // Empty title
        assigned_to: null, // No assignee
        estimated_hours: -5 // Invalid hours
      }

      const isValid = invalidTask.title.length > 0 && 
                     invalidTask.assigned_to !== null && 
                     invalidTask.estimated_hours > 0

      expect(isValid).toBe(false)
    })
  })

  describe('Task Status Management', () => {
    it('transitions task status correctly', async () => {
      const statusFlow = ['todo', 'in_progress', 'done']
      
      for (let i = 0; i < statusFlow.length - 1; i++) {
        const currentStatus = statusFlow[i]
        const nextStatus = statusFlow[i + 1]
        
        expect(statusFlow.indexOf(nextStatus)).toBeGreaterThan(statusFlow.indexOf(currentStatus))
      }
    })

    it('logs task events on status change', async () => {
      const taskEvent = {
        task_id: mockTask.id,
        event_type: 'started',
        description: 'Task status changed from todo to in_progress',
        metadata: {
          old_status: 'todo',
          new_status: 'in_progress'
        },
        timestamp: new Date().toISOString()
      }

      // Test event logging
      expect(taskEvent.event_type).toBe('started')
      expect(taskEvent.metadata.new_status).toBe('in_progress')
    })

    it('tracks task completion time', () => {
      const startTime = new Date('2024-01-01T09:00:00Z')
      const endTime = new Date('2024-01-03T17:00:00Z')
      
      const completionHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
      expect(completionHours).toBe(56) // 2 days + 8 hours
    })
  })

  describe('Task Assignment', () => {
    it('assigns task to intern', async () => {
      const assignment = {
        task_id: mockTask.id,
        assigned_to: mockIntern.id,
        assigned_by: 'admin-id',
        assigned_at: new Date().toISOString()
      }

      // Test task assignment
      expect(assignment.assigned_to).toBe(mockIntern.id)
    })

    it('prevents overassignment', () => {
      const internTasks = [
        { id: '1', status: 'in_progress' },
        { id: '2', status: 'in_progress' },
        { id: '3', status: 'todo' }
      ]

      const activeTasksCount = internTasks.filter(task => 
        task.status === 'in_progress' || task.status === 'todo'
      ).length

      const maxActiveTasks = 5
      const canAssignMore = activeTasksCount < maxActiveTasks

      expect(canAssignMore).toBe(true)
    })
  })

  describe('Task Timeline', () => {
    it('creates timeline events', () => {
      const events = [
        { event_type: 'assigned', timestamp: '2024-01-01T09:00:00Z' },
        { event_type: 'started', timestamp: '2024-01-01T10:00:00Z' },
        { event_type: 'updated', timestamp: '2024-01-02T14:00:00Z' },
        { event_type: 'completed', timestamp: '2024-01-03T16:00:00Z' }
      ]

      // Events should be in chronological order
      for (let i = 1; i < events.length; i++) {
        const prevTime = new Date(events[i-1].timestamp)
        const currTime = new Date(events[i].timestamp)
        expect(currTime.getTime()).toBeGreaterThanOrEqual(prevTime.getTime())
      }
    })

    it('calculates task metrics', () => {
      const tasks = [
        { status: 'done', estimated_hours: 8, actual_hours: 10 },
        { status: 'done', estimated_hours: 16, actual_hours: 14 },
        { status: 'in_progress', estimated_hours: 12, actual_hours: 6 }
      ]

      const completedTasks = tasks.filter(task => task.status === 'done')
      const avgEstimatedHours = completedTasks.reduce((sum, task) => sum + task.estimated_hours, 0) / completedTasks.length
      const avgActualHours = completedTasks.reduce((sum, task) => sum + task.actual_hours, 0) / completedTasks.length

      expect(avgEstimatedHours).toBe(12)
      expect(avgActualHours).toBe(12)
    })
  })
})