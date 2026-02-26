type Props = { status: string }

export default function StatusBadge({ status }: Props) {
  const styles: Record<string, string> = {
    active: 'text-green-400 border-green-800',
    approved: 'text-green-400 border-green-800',
    rejected: 'text-red-400 border-red-800',
    pending: 'text-yellow-400 border-yellow-800',
    draft: 'text-gray-400 border-gray-700',
    todo: 'text-gray-400 border-gray-700',
    in_progress: 'text-yellow-400 border-yellow-800',
    done: 'text-green-400 border-green-800',
  }
  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${styles[status] || 'text-gray-400 border-gray-700'}`}>
      {status}
    </span>
  )
}
