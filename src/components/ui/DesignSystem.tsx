// Consistent design tokens used everywhere
export const colors = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  success: 'bg-green-900 text-green-300 border-green-700',
  warning: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  danger:  'bg-red-900 text-red-300 border-red-700',
  neutral: 'bg-gray-800 text-gray-300 border-gray-700',
}

export const focusRing = 'focus:outline-none focus:ring-2 focus:ring-blue-500'

export function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: colors.success,
    pending: colors.warning,
    rejected: colors.danger,
    expired: 'bg-gray-800 text-gray-400 border-gray-600',
  }
  const cls = map[status] || colors.neutral
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>
      {status}
    </span>
  )
}

export function PrimaryButton({ children, onClick, disabled, type = 'button' }: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${colors.primary} disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors ${focusRing}`}>
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors ${className}`}>
      {children}
    </div>
  )
}

export function SectionHeader({ title, subtitle }: { title: string, subtitle?: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{title}</h2>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}
