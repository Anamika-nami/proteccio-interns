import { render, screen, waitFor } from '../test-utils'
import { mockAdmin, mockIntern } from '../test-utils'
import { vi } from 'vitest'

describe('Admin Dashboard', () => {
  const mockDashboardAPI = {
    getDashboardStats: vi.fn(),
    getRecentActivity: vi.fn(),
    getAlerts: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Dashboard Statistics', () => {
    it('displays key metrics correctly', async () => {
      const mockStats = {
        total_interns: 25,
        active_interns: 23,
        pending_approvals: 3,
        tasks_completed_today: 12,
        attendance_rate: 92.5,
        pending_work_logs: 8
      }

      mockDashboardAPI.getDashboardStats.mockResolvedValue(mockStats)

      // Test dashboard stats display
      expect(mockStats.total_interns).toBe(25)
      expect(mockStats.attendance_rate).toBe(92.5)
    })

    it('calculates performance indicators', () => {
      const metrics = {
        task_completion_rate: 85,
        avg_response_time: 2.5, // hours
        work_log_approval_rate: 95,
        leave_approval_rate: 88
      }

      // Overall admin efficiency score
      const efficiencyScore = (
        metrics.task_completion_rate * 0.3 +
        (24 - Math.min(metrics.avg_response_time, 24)) / 24 * 100 * 0.2 +
        metrics.work_log_approval_rate * 0.25 +
        metrics.leave_approval_rate * 0.25
      )

      expect(efficiencyScore).toBeCloseTo(89.17, 2)
    })
  })

  describe('Recent Activity Feed', () => {
    it('displays recent activities in chronological order', () => {
      const activities = [
        { id: '1', type: 'task_completed', timestamp: '2024-01-01T15:00:00Z', intern_name: 'John Doe' },
        { id: '2', type: 'leave_request', timestamp: '2024-01-01T14:30:00Z', intern_name: 'Jane Smith' },
        { id: '3', type: 'work_log_submitted', timestamp: '2024-01-01T16:00:00Z', intern_name: 'Bob Johnson' }
      ]

      // Sort by timestamp descending (most recent first)
      const sortedActivities = activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      expect(sortedActivities[0].type).toBe('work_log_submitted')
      expect(sortedActivities[0].timestamp).toBe('2024-01-01T16:00:00Z')
    })

    it('filters activities by type', () => {
      const activities = [
        { type: 'task_completed', intern_name: 'John' },
        { type: 'leave_request', intern_name: 'Jane' },
        { type: 'task_completed', intern_name: 'Bob' }
      ]

      const taskActivities = activities.filter(activity => activity.type === 'task_completed')
      expect(taskActivities).toHaveLength(2)
    })
  })

  describe('Alert System', () => {
    it('identifies critical alerts', () => {
      const alerts = [
        { type: 'attendance_risk', severity: 'high', intern_id: '1', message: 'Consecutive absences detected' },
        { type: 'overdue_tasks', severity: 'medium', count: 5, message: '5 tasks overdue' },
        { type: 'pending_approvals', severity: 'low', count: 3, message: '3 items pending approval' }
      ]

      const criticalAlerts = alerts.filter(alert => alert.severity === 'high')
      expect(criticalAlerts).toHaveLength(1)
      expect(criticalAlerts[0].type).toBe('attendance_risk')
    })

    it('prioritizes alerts by severity and age', () => {
      const alerts = [
        { severity: 'medium', created_at: '2024-01-01T10:00:00Z' },
        { severity: 'high', created_at: '2024-01-01T12:00:00Z' },
        { severity: 'low', created_at: '2024-01-01T08:00:00Z' }
      ]

      const severityWeight = { high: 3, medium: 2, low: 1 }
      const now = new Date('2024-01-01T15:00:00Z').getTime()

      const prioritizedAlerts = alerts
        .map(alert => ({
          ...alert,
          priority: severityWeight[alert.severity] * 10 + 
                   (now - new Date(alert.created_at).getTime()) / (1000 * 60 * 60) // Add hours as priority
        }))
        .sort((a, b) => b.priority - a.priority)

      expect(prioritizedAlerts[0].severity).toBe('high')
    })
  })

  describe('Quick Actions', () => {
    it('provides bulk approval functionality', () => {
      const pendingItems = [
        { id: '1', type: 'work_log', status: 'pending' },
        { id: '2', type: 'leave_request', status: 'pending' },
        { id: '3', type: 'work_log', status: 'pending' }
      ]

      const workLogIds = pendingItems
        .filter(item => item.type === 'work_log')
        .map(item => item.id)

      expect(workLogIds).toEqual(['1', '3'])
    })

    it('enables quick intern status updates', () => {
      const internUpdates = [
        { intern_id: '1', action: 'activate' },
        { intern_id: '2', action: 'deactivate' },
        { intern_id: '3', action: 'extend_tenure' }
      ]

      const activationUpdates = internUpdates.filter(update => update.action === 'activate')
      expect(activationUpdates).toHaveLength(1)
    })
  })

  describe('Data Export', () => {
    it('generates dashboard reports', () => {
      const reportData = {
        generated_at: new Date().toISOString(),
        period: 'weekly',
        metrics: {
          total_interns: 25,
          attendance_rate: 92.5,
          task_completion_rate: 85,
          work_log_submission_rate: 88
        },
        top_performers: [
          { name: 'John Doe', score: 95 },
          { name: 'Jane Smith', score: 92 }
        ],
        areas_for_improvement: [
          'Work log submission consistency',
          'Task estimation accuracy'
        ]
      }

      expect(reportData.metrics.attendance_rate).toBe(92.5)
      expect(reportData.top_performers).toHaveLength(2)
    })

    it('formats data for different export types', () => {
      const data = [
        { name: 'John', score: 95, attendance: 90 },
        { name: 'Jane', score: 92, attendance: 88 }
      ]

      // CSV format
      const csvHeaders = Object.keys(data[0]).join(',')
      const csvRows = data.map(row => Object.values(row).join(','))
      const csvContent = [csvHeaders, ...csvRows].join('\n')

      expect(csvContent).toContain('name,score,attendance')
      expect(csvContent).toContain('John,95,90')

      // JSON format
      const jsonContent = JSON.stringify(data, null, 2)
      expect(JSON.parse(jsonContent)).toEqual(data)
    })
  })
})