import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Contact from '@/app/contact/page'

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockClear()
})

describe('Contact Form', () => {
  it('shows validation errors when form is submitted empty', async () => {
    render(<Contact />)
    const button = screen.getByRole('button', { name: /send message/i })
    fireEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('shows email error for invalid email format', async () => {
    render(<Contact />)
    const emailInput = screen.getByPlaceholderText(/your email/i)
    fireEvent.change(emailInput, { target: { value: 'bad-email' } })
    fireEvent.blur(emailInput)
    await waitFor(() => {
      expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument()
    })
  })

  it('calls fetch when all fields are valid and submit is clicked', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    render(<Contact />)

    fireEvent.change(screen.getByPlaceholderText(/your name/i), { target: { value: 'Anamika Nami' } })
    fireEvent.change(screen.getByPlaceholderText(/your email/i), { target: { value: 'anamika@example.com' } })
    fireEvent.change(screen.getByPlaceholderText(/subject/i), { target: { value: 'Valid subject line' } })
    fireEvent.change(screen.getByPlaceholderText(/your message/i), { target: { value: 'This is a message that is long enough to pass validation rules.' } })

    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' }))
    })
  })
})
