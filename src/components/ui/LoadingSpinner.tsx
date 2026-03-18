interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }

  return (
    <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]} ${className}`} />
  )
}

export function LoadingSkeleton({ className = '', children }: { className?: string, children?: React.ReactNode }) {
  return (
    <div className={`animate-pulse bg-gray-800 rounded ${className}`}>
      {children}
    </div>
  )
}