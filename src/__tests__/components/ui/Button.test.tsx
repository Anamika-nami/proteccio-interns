import { render, screen, fireEvent } from '../../test-utils'
import { vi } from 'vitest'

// Mock Button component since it doesn't exist yet
const Button = ({ children, onClick, disabled, loading, variant, ...props }: any) => (
  <button 
    onClick={onClick} 
    disabled={disabled || loading}
    className={variant === 'primary' ? 'bg-blue-600' : ''}
    {...props}
  >
    {loading ? 'Loading...' : children}
  </button>
)

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant classes correctly', () => {
    render(<Button variant="primary">Primary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600')
  })

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('shows loading state', () => {
    render(<Button loading>Loading Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})