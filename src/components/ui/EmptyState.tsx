type Props = {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon = '📭', title, description, action }: Props) {
  return (
    <div className="text-center py-24 border border-gray-800 rounded-xl bg-gray-900">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      {description && <p className="text-gray-500 mb-4 text-sm">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="text-blue-400 hover:underline text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
