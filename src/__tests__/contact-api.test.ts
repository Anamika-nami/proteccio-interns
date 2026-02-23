import { describe, it, expect, vi } from 'vitest'

// Mock all external dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({
        order: vi.fn(() => ({ data: [], error: null }))
      }))
    }))
  }))
}))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => true),
  getIP: vi.fn(() => '127.0.0.1')
}))

vi.mock('@/lib/logger', () => ({
  logActivity: vi.fn()
}))

describe('POST /api/contact', () => {
  it('returns 201 when all fields are valid', async () => {
    const { POST } = await import('@/app/api/contact/route')
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Anamika Nami',
        email: 'anamika@example.com',
        subject: 'Test subject here',
        body: 'This is a long enough test message to pass the 20 character validation rule.'
      })
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('returns 400 when fields are missing or invalid', async () => {
    const { POST } = await import('@/app/api/contact/route')
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'not-an-email', subject: 'hi', body: 'short' })
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Validation failed')
    expect(json.fields).toBeDefined()
  })

  it('returns 429 when rate limit is exceeded', async () => {
    const { rateLimit } = await import('@/lib/rate-limit')
    vi.mocked(rateLimit).mockReturnValueOnce(false)
    const { POST } = await import('@/app/api/contact/route')
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test',
        email: 'test@example.com',
        subject: 'Valid subject',
        body: 'This is a long enough body to pass the validation check easily.'
      })
    })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })
})

describe('GET /api/contact', () => {
  it('returns 200 with array of messages', async () => {
    const { GET } = await import('@/app/api/contact/route')
    const req = new Request('http://localhost/api/contact')
    const res = await GET()
    expect(res.status).toBe(200)
  })
})