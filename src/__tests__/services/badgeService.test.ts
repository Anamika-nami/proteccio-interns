import { describe, it, expect, vi } from 'vitest'
import { BadgeService } from '@/services/badgeService'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [
            {
              id: 'badge-1',
              name: 'TASK_MASTER',
              description: 'Completed 20+ tasks',
              icon: '🏆',
              criteria: { min_tasks: 20 },
              created_at: new Date().toISOString()
            }
          ],
          error: null
        })),
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          })),
          single: vi.fn(() => ({
            data: { id: 'badge-1' },
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'intern-badge-1',
              intern_id: 'intern-123',
              badge_id: 'badge-1',
              earned_at: new Date().toISOString()
            },
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

describe('BadgeService', () => {
  describe('getAllBadges', () => {
    it('should return all badges', async () => {
      const result = await BadgeService.getAllBadges()
      expect(result.success).toBe(true)
      expect(result.badges).toBeDefined()
      expect(Array.isArray(result.badges)).toBe(true)
    })
  })

  describe('assignBadge', () => {
    it('should assign badge to intern', async () => {
      const result = await BadgeService.assignBadge('intern-123', 'TASK_MASTER', 'admin-123')
      expect(result.success).toBe(true)
      expect(result.badge).toBeDefined()
    })
  })
})
