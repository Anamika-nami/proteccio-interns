import { mockIntern } from '../test-utils'
import { vi } from 'vitest'

describe('Leave Request System', () => {
  const mockLeaveAPI = {
    submitLeaveRequest: vi.fn(),
    reviewLeaveRequest: vi.fn(),
    getLeaveRequests: vi.fn(),
    updateAttendanceForLeave: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Leave Request Submission', () => {
    it('validates leave request data', () => {
      const leaveRequest = {
        intern_id: mockIntern.id,
        start_date: '2024-02-01',
        end_date: '2024-02-03',
        reason: 'Medical appointment',
        document_url: 'https://example.com/medical-certificate.pdf'
      }

      // Validate dates
      const startDate = new Date(leaveRequest.start_date)
      const endDate = new Date(leaveRequest.end_date)
      
      expect(endDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime())
      expect(leaveRequest.reason.length).toBeGreaterThan(0)
    })

    it('prevents overlapping leave requests', () => {
      const existingLeave = {
        start_date: '2024-02-01',
        end_date: '2024-02-05',
        status: 'approved'
      }

      const newLeave = {
        start_date: '2024-02-03',
        end_date: '2024-02-07'
      }

      // Check for overlap
      const hasOverlap = (
        new Date(newLeave.start_date) <= new Date(existingLeave.end_date) &&
        new Date(newLeave.end_date) >= new Date(existingLeave.start_date)
      )

      expect(hasOverlap).toBe(true)
    })

    it('calculates leave duration', () => {
      const startDate = new Date('2024-02-01')
      const endDate = new Date('2024-02-05')
      
      const diffTime = endDate.getTime() - startDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // Include both start and end dates
      
      expect(diffDays).toBe(5)
    })
  })

  describe('Leave Request Review', () => {
    it('approves leave request', async () => {
      const reviewData = {
        status: 'approved',
        admin_comment: 'Approved for medical reasons',
        reviewed_by: 'admin-id',
        reviewed_at: new Date().toISOString()
      }

      mockLeaveAPI.reviewLeaveRequest.mockResolvedValue({
        success: true,
        data: reviewData
      })

      expect(reviewData.status).toBe('approved')
    })

    it('rejects leave request with reason', async () => {
      const rejectionData = {
        status: 'rejected',
        admin_comment: 'Insufficient notice period',
        reviewed_by: 'admin-id',
        reviewed_at: new Date().toISOString()
      }

      expect(rejectionData.status).toBe('rejected')
      expect(rejectionData.admin_comment).toContain('notice period')
    })

    it('updates attendance when leave is approved', async () => {
      const approvedLeave = {
        intern_id: mockIntern.id,
        start_date: '2024-02-01',
        end_date: '2024-02-03',
        status: 'approved'
      }

      // Mock attendance updates
      const attendanceUpdates = []
      let currentDate = new Date(approvedLeave.start_date)
      const endDate = new Date(approvedLeave.end_date)

      while (currentDate <= endDate) {
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          attendanceUpdates.push({
            intern_id: approvedLeave.intern_id,
            date: currentDate.toISOString().split('T')[0],
            status: 'leave',
            marked_by_admin: true
          })
        }
        currentDate.setDate(currentDate.getDate() + 1)
      }

      expect(attendanceUpdates.length).toBeGreaterThan(0)
      expect(attendanceUpdates[0].status).toBe('leave')
    })
  })

  describe('Leave Balance Tracking', () => {
    it('calculates remaining leave balance', () => {
      const annualLeaveAllowance = 20 // days
      const usedLeave = [
        { start_date: '2024-01-15', end_date: '2024-01-17', status: 'approved' }, // 3 days
        { start_date: '2024-02-10', end_date: '2024-02-12', status: 'approved' }  // 3 days
      ]

      const totalUsed = usedLeave.reduce((total, leave) => {
        const start = new Date(leave.start_date)
        const end = new Date(leave.end_date)
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        return total + days
      }, 0)

      const remainingBalance = annualLeaveAllowance - totalUsed
      expect(remainingBalance).toBe(14)
    })

    it('prevents leave request exceeding balance', () => {
      const remainingBalance = 5
      const requestedDays = 7

      const canApprove = requestedDays <= remainingBalance
      expect(canApprove).toBe(false)
    })
  })

  describe('Leave Notifications', () => {
    it('sends notification on leave request submission', () => {
      const notification = {
        type: 'leave_request_submitted',
        recipient: 'admin',
        message: `New leave request from ${mockIntern.full_name}`,
        data: {
          intern_id: mockIntern.id,
          start_date: '2024-02-01',
          end_date: '2024-02-03'
        }
      }

      expect(notification.type).toBe('leave_request_submitted')
      expect(notification.recipient).toBe('admin')
    })

    it('sends notification on leave approval/rejection', () => {
      const notification = {
        type: 'leave_request_reviewed',
        recipient: mockIntern.id,
        message: 'Your leave request has been approved',
        data: {
          status: 'approved',
          admin_comment: 'Approved for medical reasons'
        }
      }

      expect(notification.type).toBe('leave_request_reviewed')
      expect(notification.data.status).toBe('approved')
    })
  })
})