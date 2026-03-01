type Props = {
  icon?: string
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon = '📭', title, description, action }: Props) {
  return (
    <div className="text-center py-16 border border-gray-800 rounded-xl bg-gray-900">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">{description}</p>}
      {action && (
        <button onClick={action.onClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
          {action.label}
        </button>
      )}
    </div>
  )
}
