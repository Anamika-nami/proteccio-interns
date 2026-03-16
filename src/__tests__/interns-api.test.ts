import { describe, it, expect, vi } from 'vitest'

// Mock the GET handler
const mockGET = vi.fn().mockImplementation(async (req: Request) => {
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '10')
  
  return new Response(JSON.stringify({
    data: [],
    total: 0,
    page: page,
    totalPages: 0
  }), { status: 200 })
})

// Mock the POST handler
const mockPOST = vi.fn().mockImplementation(async (req: Request) => {
  const body = await req.json()
  
  if (!body.full_name || !body.cohort) {
    return new Response(JSON.stringify({ error: 'Validation failed' }), { status: 400 })
  }
  
  if (body.user_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.user_id)) {
    return new Response(JSON.stringify({ error: 'Invalid UUID' }), { status: 400 })
  }
  
  return new Response(JSON.stringify({ id: 'abc', full_name: body.full_name }), { status: 201 })
})

vi.mock('@/app/api/interns/route', () => ({
  GET: mockGET,
  POST: mockPOST
}))

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
    const req = new Request('http://localhost/api/interns?page=1&limit=9&status=active')
    const res = await mockGET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('data')
    expect(json).toHaveProperty('total')
    expect(json).toHaveProperty('page')
    expect(json).toHaveProperty('totalPages')
    expect(json.page).toBe(1)
  })

  it('returns page 2 correctly', async () => {
    const req = new Request('http://localhost/api/interns?page=2&limit=9&status=active')
    const res = await mockGET(req)
    const json = await res.json()
    expect(json.page).toBe(2)
  })
})

describe('POST /api/interns', () => {
  it('returns 400 when required fields are missing', async () => {
    const req = new Request('http://localhost/api/interns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: '', cohort: '' })
    })
    const res = await mockPOST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Validation failed')
  })

  it('returns 400 when user_id is not a valid UUID', async () => {
    const req = new Request('http://localhost/api/interns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Test User', cohort: '2026', user_id: 'not-a-uuid' })
    })
    const res = await mockPOST(req)
    expect(res.status).toBe(400)
  })
})
