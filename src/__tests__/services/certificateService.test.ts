import { describe, it, expect, vi } from 'vitest'
import { CertificateService } from '@/services/certificateService'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'intern-123',
              full_name: 'John Doe',
              cohort: 'Summer 2024',
              status: 'COMPLETED',
              created_at: new Date('2024-01-01').toISOString()
            },
            error: null
          }))
        }))
      }))
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => ({
          data: { path: 'intern-123/certificate.pdf' },
          error: null
        })),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://example.com/certificate.pdf' }
        })),
        list: vi.fn(() => ({
          data: [{ name: 'certificate.pdf' }],
          error: null
        }))
      }))
    }
  }))
}))

vi.mock('@/lib/logger', () => ({
  logActivity: vi.fn()
}))

describe('CertificateService', () => {
  describe('generateCertificateData', () => {
    it('should generate certificate data for completed intern', async () => {
      const result = await CertificateService.generateCertificateData('intern-123')
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.intern_name).toBe('John Doe')
      expect(result.data?.role).toBe('Summer 2024 Intern')
      expect(result.data?.organization).toBe('Proteccio Interns')
    })

    it('should include certificate ID', async () => {
      const result = await CertificateService.generateCertificateData('intern-123')
      expect(result.data?.certificate_id).toMatch(/^CERT-/)
    })
  })

  describe('hasCertificate', () => {
    it('should check if certificate exists', async () => {
      const result = await CertificateService.hasCertificate('intern-123')
      expect(typeof result).toBe('boolean')
    })
  })
})
