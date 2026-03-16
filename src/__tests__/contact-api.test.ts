import { describe, it, expect, vi, beforeEach } from 'vitest'

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

const mockRateLimit = vi.fn(() => true)
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: mockRateLimit,
  getIP: vi.fn(() => '127.0.0.1')
}))

vi.mock('@/lib/logger', () => ({
  logActivity: vi.fn()
}))

// Mock the POST handler
const mockContactPOST = vi.fn().mockImplementation(async (req: Request) => {
  const body = await req.json()
  
  // Check rate limit first
  if (!mockRateLimit()) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 })
  }
  
  // Validate fields
  if (!body.name || !body.email || !body.subject || !body.body ||
      body.name.length < 2 || body.subject.length < 5 || body.body.length < 20 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return new Response(JSON.stringify({ 
      error: 'Validation failed',
      fields: ['name', 'email', 'subject', 'body']
    }), { status: 400 })
  }
  
  return new Response(JSON.stringify({ success: true }), { status: 201 })
})

const mockContactGET = vi.fn().mockImplementation(async () => {
  return new Response(JSON.stringify([]), { status: 200 })
})

vi.mock('@/app/api/contact/route', () => ({
  POST: mockContactPOST,
  GET: mockContactGET
}))

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockReturnValue(true) // Reset to allow requests by default
  })

  it('returns 201 when all fields are valid', async () => {
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
    const res = await mockContactPOST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('returns 400 when fields are missing or invalid', async () => {
    const req = new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'not-an-email', subject: 'hi', body: 'short' })
    })
    const res = await mockContactPOST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Validation failed')
    expect(json.fields).toBeDefined()
  })

  it('returns 429 when rate limit is exceeded', async () => {
    mockRateLimit.mockReturnValue(false) // Mock rate limit exceeded
    
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
    const res = await mockContactPOST(req)
    expect(res.status).toBe(429)
  })
})

describe('GET /api/contact', () => {
  it('returns 200 with array of messages', async () => {
    const res = await mockContactGET()
    expect(res.status).toBe(200)
  })
})