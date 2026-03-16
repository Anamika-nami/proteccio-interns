import { describe, it, expect, vi } from 'vitest'
import { CompletionService } from '@/services/completionService'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn()
}))

vi.mock('@/lib/logger', () => ({
  logActivity: vi.fn()
}))

vi.mock('@/services/evaluationService', () => ({
  EvaluationService: {
    hasEvaluation: vi.fn(() => Promise.resolve(true))
  }
}))

describe('CompletionService', () => {
  describe('isValidTransition', () => {
    it('should allow ACTIVE to COMPLETION_REVIEW', () => {
      const result = CompletionService.isValidTransition('ACTIVE', 'COMPLETION_REVIEW')
      expect(result).toBe(true)
    })

    it('should allow COMPLETION_REVIEW to COMPLETED', () => {
      const result = CompletionService.isValidTransition('COMPLETION_REVIEW', 'COMPLETED')
      expect(result).toBe(true)
    })

    it('should not allow COMPLETED to any status', () => {
      const result = CompletionService.isValidTransition('COMPLETED', 'ACTIVE')
      expect(result).toBe(false)
    })

    it('should allow ACTIVE to TERMINATED', () => {
      const result = CompletionService.isValidTransition('ACTIVE', 'TERMINATED')
      expect(result).toBe(true)
    })

    it('should allow EXTENDED to COMPLETION_REVIEW', () => {
      const result = CompletionService.isValidTransition('EXTENDED', 'COMPLETION_REVIEW')
      expect(result).toBe(true)
    })

    it('should not allow invalid transitions', () => {
      const result = CompletionService.isValidTransition('ACTIVE', 'COMPLETED')
      expect(result).toBe(false)
    })
  })
})
