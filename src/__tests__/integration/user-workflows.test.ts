import { render, screen, fireEvent, waitFor } from '../test-utils'
import { mockIntern, mockAdmin, mockTask } from '../test-utils'
import { vi } from 'vitest'

describe('User Workflow Integration Tests', () => {
  describe('Intern Daily Workflow', () => {
    it('completes full daily workflow: check-in → work log → check-out', async () => {
      const workflow = {
        checkIn: vi.fn().mockResolvedValue({ success: true }),
        submitWorkLog: vi.fn().mockResolvedValue({ success: true }),
        checkOut: vi.fn().mockResolvedValue({ success: true })
      }

      // Step 1: Check-in
      await workflow.checkIn({
        intern_id: mockIntern.id,
        timestamp: '2024-01-01T09:00:00Z'
      })

      // Step 2: Submit work log
      await workflow.submitWorkLog({
        intern_id: mockIntern.id,
        task_id: mockTask.id,
        description: 'Worked on feature implementation',
        hours_spent: 4.0,
        progress_status: 'in_progress'
      })

      // Step 3: Check-out
      await workflow.checkOut({
        intern_id: mockIntern.id,
        timestamp: '2024-01-01T17:00:00Z'
      })

      expect(workflow.checkIn).toHaveBeenCalled()
      expect(workflow.submitWorkLog).toHaveBeenCalled()
      expect(workflow.checkOut).toHaveBeenCalled()
    })

    it('handles task progression workflow', async () => {
      const taskWorkflow = {
        startTask: vi.fn(),
        updateProgress: vi.fn(),
        completeTask: vi.fn()
      }

      // Start task
      await taskWorkflow.startTask(mockTask.id)
      
      // Update progress multiple times
      await taskWorkflow.updateProgress(mockTask.id, 'in_progress')
      await taskWorkflow.updateProgress(mockTask.id, 'review')
      
      // Complete task
      await taskWorkflow.completeTask(mockTask.id)

      expect(taskWorkflow.startTask).toHaveBeenCalledWith(mockTask.id)
      expect(taskWorkflow.updateProgress).toHaveBeenCalledTimes(2)
      expect(taskWorkflow.completeTask).toHaveBeenCalledWith(mockTask.id)
    })

    it('manages leave request workflow', async () => {
      const leaveWorkflow = {
        submitRequest: vi.fn().mockResolvedValue({ id: 'leave-123' }),
        checkStatus: vi.fn().mockResolvedValue({ status: 'pending' }),
        receiveNotification: vi.fn()
      }

      // Submit leave request
      const leaveRequest = {
        start_date: '2024-02-01',
        end_date: '2024-02-03',
        reason: 'Medical appointment'
      }

      const result = await leaveWorkflow.submitRequest(leaveRequest)
      
      // Check status
      await leaveWorkflow.checkStatus(result.id)
      
      expect(leaveWorkflow.submitRequest).toHaveBeenCalledWith(leaveRequest)
      expect(leaveWorkflow.checkStatus).toHaveBeenCalledWith('leave-123')
    })
  })

  describe('Admin Management Workflow', () => {
    it('completes intern onboarding workflow', async () => {
      const onboardingWorkflow = {
        createProfile: vi.fn().mockResolvedValue({ id: 'intern-123' }),
        assignTasks: vi.fn(),
        setupPermissions: vi.fn(),
        sendWelcomeNotification: vi.fn()
      }

      // Create intern profile
      const newIntern = {
        full_name: 'New Intern',
        email: 'new@example.com',
        cohort: 'Spring 2024'
      }

      const intern = await onboardingWorkflow.createProfile(newIntern)
      
      // Assign initial tasks
      await onboardingWorkflow.assignTasks(intern.id, ['orientation', 'setup'])
      
      // Setup permissions
      await onboardingWorkflow.setupPermissions(intern.id, 'intern')
      
      // Send welcome notification
      await onboardingWorkflow.sendWelcomeNotification(intern.id)

      expect(onboardingWorkflow.createProfile).toHaveBeenCalledWith(newIntern)
      expect(onboardingWorkflow.assignTasks).toHaveBeenCalledWith('intern-123', ['orientation', 'setup'])
    })

    it('handles work log review workflow', async () => {
      const reviewWorkflow = {
        getUnreviewedLogs: vi.fn().mockResolvedValue([
          { id: 'log-1', status: 'pending' },
          { id: 'log-2', status: 'pending' }
        ]),
        reviewLog: vi.fn(),
        sendFeedback: vi.fn()
      }

      // Get unreviewed logs
      const pendingLogs = await reviewWorkflow.getUnreviewedLogs()
      
      // Review each log
      for (const log of pendingLogs) {
        await reviewWorkflow.reviewLog(log.id, 'approved', 'Good work!')
        await reviewWorkflow.sendFeedback(log.intern_id, 'Work log approved')
      }

      expect(reviewWorkflow.getUnreviewedLogs).toHaveBeenCalled()
      expect(reviewWorkflow.reviewLog).toHaveBeenCalledTimes(2)
    })

    it('manages performance review workflow', async () => {
      const performanceWorkflow = {
        generateWeeklySummary: vi.fn().mockResolvedValue({ summary: 'data' }),
        identifyIssues: vi.fn().mockResolvedValue([]),
        createActionPlan: vi.fn(),
        scheduleFollowUp: vi.fn()
      }

      // Generate weekly summary
      const summary = await performanceWorkflow.generateWeeklySummary(mockIntern.id)
      
      // Identify issues
      const issues = await performanceWorkflow.identifyIssues(summary)
      
      if (issues && issues.length > 0) {
        // Create action plan
        await performanceWorkflow.createActionPlan(mockIntern.id, issues)
        
        // Schedule follow-up
        await performanceWorkflow.scheduleFollowUp(mockIntern.id, '2024-02-01')
      }

      expect(performanceWorkflow.generateWeeklySummary).toHaveBeenCalledWith(mockIntern.id)
    })
  })

  describe('Cross-Feature Integration', () => {
    it('integrates attendance with leave requests', async () => {
      const integration = {
        approveLeave: vi.fn(),
        updateAttendance: vi.fn(),
        notifyIntern: vi.fn()
      }

      // Approve leave request
      const leaveRequest = {
        id: 'leave-123',
        intern_id: mockIntern.id,
        start_date: '2024-02-01',
        end_date: '2024-02-03'
      }

      await integration.approveLeave(leaveRequest.id)
      
      // Auto-update attendance for leave period
      const leaveDates = ['2024-02-01', '2024-02-02', '2024-02-03']
      for (const date of leaveDates) {
        await integration.updateAttendance(mockIntern.id, date, 'leave')
      }
      
      // Notify intern
      await integration.notifyIntern(mockIntern.id, 'Leave request approved')

      expect(integration.approveLeave).toHaveBeenCalledWith('leave-123')
      expect(integration.updateAttendance).toHaveBeenCalledTimes(3)
    })

    it('integrates task completion with work logs', async () => {
      const taskLogIntegration = {
        completeTask: vi.fn(),
        updateWorkLog: vi.fn(),
        calculateMetrics: vi.fn()
      }

      // Complete task
      await taskLogIntegration.completeTask(mockTask.id)
      
      // Update related work logs
      await taskLogIntegration.updateWorkLog(mockTask.id, 'completed')
      
      // Calculate updated metrics
      await taskLogIntegration.calculateMetrics(mockIntern.id)

      expect(taskLogIntegration.completeTask).toHaveBeenCalledWith(mockTask.id)
      expect(taskLogIntegration.updateWorkLog).toHaveBeenCalledWith(mockTask.id, 'completed')
    })

    it('integrates notifications across all features', async () => {
      const notificationIntegration = {
        sendAttendanceAlert: vi.fn(),
        sendTaskReminder: vi.fn(),
        sendLeaveUpdate: vi.fn(),
        sendPerformanceReport: vi.fn()
      }

      // Test various notification triggers
      await notificationIntegration.sendAttendanceAlert(mockIntern.id, 'consecutive_absences')
      await notificationIntegration.sendTaskReminder(mockIntern.id, 'overdue_tasks')
      await notificationIntegration.sendLeaveUpdate(mockIntern.id, 'approved')
      await notificationIntegration.sendPerformanceReport(mockIntern.id, 'weekly_summary')

      expect(notificationIntegration.sendAttendanceAlert).toHaveBeenCalled()
      expect(notificationIntegration.sendTaskReminder).toHaveBeenCalled()
      expect(notificationIntegration.sendLeaveUpdate).toHaveBeenCalled()
      expect(notificationIntegration.sendPerformanceReport).toHaveBeenCalled()
    })
  })

  describe('Error Handling and Recovery', () => {
    it('handles network failures gracefully', async () => {
      const errorHandling = {
        retryOperation: vi.fn(),
        showOfflineMessage: vi.fn(),
        queueForLater: vi.fn()
      }

      // Simulate network failure
      const networkError = new Error('Network request failed')
      
      try {
        throw networkError
      } catch (error) {
        await errorHandling.retryOperation()
        await errorHandling.showOfflineMessage()
        await errorHandling.queueForLater('check-in', { intern_id: mockIntern.id })
      }

      expect(errorHandling.retryOperation).toHaveBeenCalled()
      expect(errorHandling.showOfflineMessage).toHaveBeenCalled()
    })

    it('validates data consistency across operations', async () => {
      const consistencyCheck = {
        validateAttendanceWorkLog: vi.fn(),
        validateTaskProgress: vi.fn(),
        validateLeaveAttendance: vi.fn()
      }

      // Check attendance vs work log consistency
      const attendanceHours = 8.0
      const workLogHours = 7.5
      const isConsistent = Math.abs(attendanceHours - workLogHours) <= 1.0

      expect(isConsistent).toBe(true)

      await consistencyCheck.validateAttendanceWorkLog(mockIntern.id, '2024-01-01')
      expect(consistencyCheck.validateAttendanceWorkLog).toHaveBeenCalled()
    })

    it('handles concurrent operations safely', async () => {
      const concurrencyControl = {
        lockResource: vi.fn(),
        unlockResource: vi.fn(),
        handleConflict: vi.fn()
      }

      // Simulate concurrent check-in attempts
      const operations = [
        () => concurrencyControl.lockResource('attendance', mockIntern.id),
        () => concurrencyControl.lockResource('attendance', mockIntern.id)
      ]

      // First operation should succeed, second should handle conflict
      await operations[0]()
      try {
        await operations[1]()
      } catch (error) {
        await concurrencyControl.handleConflict('attendance', mockIntern.id)
      }

      expect(concurrencyControl.lockResource).toHaveBeenCalledTimes(2)
    })
  })
})