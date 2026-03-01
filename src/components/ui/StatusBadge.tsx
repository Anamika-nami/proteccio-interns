type Props = { status: string }

const colors: Record<string, string> = {
  active:   'bg-green-900 text-green-300 border-green-700',
  pending:  'bg-yellow-900 text-yellow-300 border-yellow-700',
  rejected: 'bg-red-900 text-red-300 border-red-700',
  inactive: 'bg-gray-800 text-gray-400 border-gray-600',
}

export default function StatusBadge({ status }: Props) {
  const cls = colors[status] || colors.inactive
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>
      {status}
    </span>
  )
}
