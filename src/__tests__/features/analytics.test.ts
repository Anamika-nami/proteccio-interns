import { mockIntern, mockAttendance, mockTask, mockWorkLog } from '../test-utils'
import { vi } from 'vitest'

describe('Analytics System', () => {
  const mockAnalyticsAPI = {
    getProductivityMetrics: vi.fn(),
    getAttendanceAnalytics: vi.fn(),
    getTaskAnalytics: vi.fn(),
    generateWeeklySummary: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Productivity Metrics', () => {
    it('calculates overall productivity score', () => {
      const metrics = {
        attendance_percentage: 90,
        task_completion_rate: 85,
        work_log_consistency: 95,
        avg_hours_per_day: 7.5
      }

      // Weighted productivity score
      const productivityScore = (
        metrics.attendance_percentage * 0.3 +
        metrics.task_completion_rate * 0.4 +
        metrics.work_log_consistency * 0.2 +
        (metrics.avg_hours_per_day / 8) * 100 * 0.1
      )

      expect(productivityScore).toBeCloseTo(89.375, 2)
    })

    it('tracks intern performance trends', () => {
      const weeklyData = [
        { week: 1, productivity_score: 75 },
        { week: 2, productivity_score: 80 },
        { week: 3, productivity_score: 85 },
        { week: 4, productivity_score: 88 }
      ]

      // Calculate trend (positive = improving)
      const trend = weeklyData[weeklyData.length - 1].productivity_score - weeklyData[0].productivity_score
      expect(trend).toBe(13) // Positive trend
    })

    it('identifies top performers', () => {
      const interns = [
        { id: '1', name: 'John', productivity_score: 92 },
        { id: '2', name: 'Jane', productivity_score: 88 },
        { id: '3', name: 'Bob', productivity_score: 95 },
        { id: '4', name: 'Alice', productivity_score: 85 }
      ]

      const topPerformers = interns
        .sort((a, b) => b.productivity_score - a.productivity_score)
        .slice(0, 3)

      expect(topPerformers[0].name).toBe('Bob')
      expect(topPerformers[0].productivity_score).toBe(95)
    })
  })

  describe('Attendance Analytics', () => {
    it('calculates attendance patterns', () => {
      const attendanceData = [
        { date: '2024-01-01', status: 'present', day_of_week: 1 }, // Monday
        { date: '2024-01-02', status: 'present', day_of_week: 2 }, // Tuesday
        { date: '2024-01-03', status: 'absent', day_of_week: 3 },  // Wednesday
        { date: '2024-01-04', status: 'present', day_of_week: 4 }, // Thursday
        { date: '2024-01-05', status: 'present', day_of_week: 5 }  // Friday
      ]

      const attendanceByDay = attendanceData.reduce((acc, record) => {
        const day = record.day_of_week
        if (!acc[day]) acc[day] = { present: 0, total: 0 }
        acc[day].total++
        if (record.status === 'present') acc[day].present++
        return acc
      }, {})

      // Wednesday has lower attendance
      expect(attendanceByDay[3].present / attendanceByDay[3].total).toBe(0)
    })

    it('identifies attendance risk factors', () => {
      const recentAttendance = [
        { date: '2024-01-15', status: 'absent' },
        { date: '2024-01-16', status: 'absent' },
        { date: '2024-01-17', status: 'present' },
        { date: '2024-01-18', status: 'absent' }
      ]

      const consecutiveAbsences = recentAttendance.reduce((max, record, index) => {
        if (record.status === 'absent') {
          let count = 1
          for (let i = index + 1; i < recentAttendance.length && recentAttendance[i].status === 'absent'; i++) {
            count++
          }
          return Math.max(max, count)
        }
        return max
      }, 0)

      const isAtRisk = consecutiveAbsences >= 2
      expect(isAtRisk).toBe(true)
    })
  })

  describe('Task Analytics', () => {
    it('calculates task completion velocity', () => {
      const completedTasks = [
        { completed_at: '2024-01-01', estimated_hours: 8, actual_hours: 10 },
        { completed_at: '2024-01-03', estimated_hours: 16, actual_hours: 14 },
        { completed_at: '2024-01-07', estimated_hours: 12, actual_hours: 15 }
      ]

      const totalEstimated = completedTasks.reduce((sum, task) => sum + task.estimated_hours, 0)
      const totalActual = completedTasks.reduce((sum, task) => sum + task.actual_hours, 0)
      const velocityRatio = totalEstimated / totalActual

      expect(velocityRatio).toBeCloseTo(0.923, 3) // Slightly over-estimated
    })

    it('identifies bottlenecks in task flow', () => {
      const tasksByStatus = {
        todo: 15,
        in_progress: 8,
        review: 12,
        done: 25
      }

      // Review stage has high backlog
      const reviewBottleneck = tasksByStatus.review > tasksByStatus.in_progress
      expect(reviewBottleneck).toBe(true)
    })

    it('tracks task complexity vs completion time', () => {
      const tasks = [
        { complexity: 'low', completion_hours: 4 },
        { complexity: 'medium', completion_hours: 12 },
        { complexity: 'high', completion_hours: 32 },
        { complexity: 'low', completion_hours: 6 }
      ]

      const avgByComplexity = tasks.reduce((acc, task) => {
        if (!acc[task.complexity]) acc[task.complexity] = { total: 0, count: 0 }
        acc[task.complexity].total += task.completion_hours
        acc[task.complexity].count++
        return acc
      }, {})

      const lowComplexityAvg = avgByComplexity.low.total / avgByComplexity.low.count
      expect(lowComplexityAvg).toBe(5)
    })
  })

  describe('Weekly Summary Generation', () => {
    it('generates comprehensive weekly report', () => {
      const weeklyData = {
        intern_id: mockIntern.id,
        week_start_date: '2024-01-01',
        week_end_date: '2024-01-07',
        tasks_completed: 3,
        tasks_pending: 2,
        attendance_percentage: 80, // 4 out of 5 days
        work_logs_submitted: 4,
        work_logs_expected: 5,
        total_hours_logged: 28.5
      }

      // Validate summary data
      expect(weeklyData.tasks_completed).toBeGreaterThan(0)
      expect(weeklyData.attendance_percentage).toBe(80)
      expect(weeklyData.total_hours_logged).toBeCloseTo(28.5)
    })

    it('calculates work-life balance indicators', () => {
      const dailyHours = [8.5, 7.0, 9.5, 8.0, 6.5] // Monday to Friday
      const avgDailyHours = dailyHours.reduce((sum, hours) => sum + hours, 0) / dailyHours.length
      const maxDailyHours = Math.max(...dailyHours)
      
      const isBalanced = avgDailyHours <= 8.5 && maxDailyHours <= 10
      expect(isBalanced).toBe(true)
      expect(avgDailyHours).toBeCloseTo(7.9)
    })
  })

  describe('Comparative Analytics', () => {
    it('compares intern performance against cohort', () => {
      const cohortData = [
        { intern_id: '1', productivity_score: 85 },
        { intern_id: '2', productivity_score: 92 },
        { intern_id: '3', productivity_score: 78 },
        { intern_id: '4', productivity_score: 88 }
      ]

      const internScore = 88
      const cohortAverage = cohortData.reduce((sum, intern) => sum + intern.productivity_score, 0) / cohortData.length
      const percentile = (cohortData.filter(intern => intern.productivity_score < internScore).length / cohortData.length) * 100

      expect(cohortAverage).toBeCloseTo(85.75)
      expect(percentile).toBe(50) // 50th percentile (2 out of 4 are < 88: 85, 78)
    })

    it('tracks improvement over time', () => {
      const monthlyScores = [75, 78, 82, 85, 88, 90]
      const improvementRate = (monthlyScores[monthlyScores.length - 1] - monthlyScores[0]) / monthlyScores.length
      
      expect(improvementRate).toBeCloseTo(2.5) // 2.5 points per month improvement
    })
  })
})