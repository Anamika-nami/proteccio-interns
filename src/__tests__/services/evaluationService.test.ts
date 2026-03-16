import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EvaluationService } from '@/services/evaluationService'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'eval-123',
              intern_id: 'intern-123',
              evaluator_id: 'admin-123',
              task_quality_score: 4,
              consistency_score: 5,
              attendance_score: 4,
              communication_score: 5,
              learning_score: 4,
              overall_score: 4.4,
              feedback: 'Great work',
              created_at: new Date().toISOString()
            },
            error: null
          }))
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          })),
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }))
    }))
  }))
}))

vi.mock('@/lib/logger', () => ({
  logActivity: vi.fn()
}))

describe('EvaluationService', () => {
  describe('calculateOverallScore', () => {
    it('should calculate correct average score', () => {
      const scores = {
        task_quality_score: 4,
        consistency_score: 5,
        attendance_score: 4,
        communication_score: 5,
        learning_score: 4
      }

      const result = EvaluationService.calculateOverallScore(scores)
      expect(result).toBe(4.4)
    })

    it('should round to 2 decimal places', () => {
      const scores = {
        task_quality_score: 3,
        consistency_score: 4,
        attendance_score: 3,
        communication_score: 4,
        learning_score: 3
      }

      const result = EvaluationService.calculateOverallScore(scores)
      expect(result).toBe(3.4)
    })
  })

  describe('submitEvaluation', () => {
    it('should validate score ranges', async () => {
      const invalidData = {
        intern_id: 'intern-123',
        task_quality_score: 6, // Invalid
        consistency_score: 5,
        attendance_score: 4,
        communication_score: 5,
        learning_score: 4
      }

      const result = await EvaluationService.submitEvaluation('admin-123', invalidData)
      expect(result.success).toBe(false)
      expect(result.error).toContain('between 1 and 5')
    })

    it('should calculate overall score automatically', async () => {
      const data = {
        intern_id: 'intern-123',
        task_quality_score: 4,
        consistency_score: 5,
        attendance_score: 4,
        communication_score: 5,
        learning_score: 4
      }

      const result = await EvaluationService.submitEvaluation('admin-123', data)
      expect(result.success).toBe(true)
      expect(result.evaluation?.overall_score).toBe(4.4)
    })
  })
})
