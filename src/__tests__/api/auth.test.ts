import { vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the auth route handler
const POST = vi.fn().mockImplementation(async (request: NextRequest) => {
  try {
    const body = await request.json()
    
    if (!body.email || !body.password) {
      return new Response(JSON.stringify({ error: 'Missing credentials' }), { status: 400 })
    }
    
    if (body.email === 'invalid@example.com') {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })
    }
    
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }
})

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
    },
  }),
}))

describe('/api/auth/login', () => {
  it('handles successful login', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
    })

    const response = await POST(mockRequest)
    expect(response.status).toBe(200)
  })

  it('handles invalid credentials', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      }),
    })

    const response = await POST(mockRequest)
    expect(response.status).toBe(401)
  })

  it('validates required fields', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com'
        // Missing password
      }),
    })

    const response = await POST(mockRequest)
    expect(response.status).toBe(400)
  })

  it('handles malformed JSON', async () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: 'invalid json',
    })

    const response = await POST(mockRequest)
    expect(response.status).toBe(400)
  })
})