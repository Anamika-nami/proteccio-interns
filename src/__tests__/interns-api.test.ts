import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          range: vi.fn(() => ({
            order: vi.fn(() => ({ data: [], error: null, count: 0 }))
          })),
          order: vi.fn(() => ({ data: [], error: null, count: 0 }))
        })),
        order: vi.fn(() => ({ data: [], error: null, count: 0 }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ data: [{ id: 'abc', full_name: 'Test Intern' }], error: null }))
      }))
    }))
  }))
}))

vi.mock('@/lib/logger', () => ({
  logActivity: vi.fn()
}))

describe('GET /api/interns', () => {
  it('returns pagination structure', async () => {
    const { GET } = await import('@/app/api/interns/route')
    const req = new Request('http://localhost/api/interns?page=1&limit=9&status=active')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('data')
    expect(json).toHaveProperty('total')
    expect(json).toHaveProperty('page')
    expect(json).toHaveProperty('totalPages')
    expect(json.page).toBe(1)
  })

  it('returns page 2 correctly', async () => {
    const { GET } = await import('@/app/api/interns/route')
    const req = new Request('http://localhost/api/interns?page=2&limit=9&status=active')
    const res = await GET(req)
    const json = await res.json()
    expect(json.page).toBe(2)
  })
})

describe('POST /api/interns', () => {
  it('returns 400 when required fields are missing', async () => {
    const { POST } = await import('@/app/api/interns/route')
    const req = new Request('http://localhost/api/interns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: '', cohort: '' })
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Validation failed')
  })

  it('returns 400 when user_id is not a valid UUID', async () => {
    const { POST } = await import('@/app/api/interns/route')
    const req = new Request('http://localhost/api/interns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Test User', cohort: '2026', user_id: 'not-a-uuid' })
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
