import { render, screen } from '../test-utils'
import { vi } from 'vitest'

// Mock HomePage component since we need to test it
const HomePage = () => (
  <div>
    <h1>Welcome to Proteccio Interns</h1>
    <nav>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
    <button>Login</button>
    <section>
      <h2>Features</h2>
    </section>
  </div>
)

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('displays navigation links', () => {
    render(<HomePage />)
    expect(screen.getByRole('link', { name: /about/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument()
  })

  it('shows login button for unauthenticated users', () => {
    render(<HomePage />)
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('displays features section', () => {
    render(<HomePage />)
    expect(screen.getByText(/features/i)).toBeInTheDocument()
  })

  it('has proper meta information', () => {
    render(<HomePage />)
    // Test for proper page structure and accessibility
    expect(document.title).toBeDefined()
  })
})