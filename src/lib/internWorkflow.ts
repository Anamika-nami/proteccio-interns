// Valid lifecycle transitions
const TRANSITIONS: Record<string, string[]> = {
  draft:    ['pending'],
  pending:  ['approved', 'inactive'],
  approved: ['active', 'inactive'],
  active:   ['inactive', 'archived'],
  inactive: ['active', 'archived', 'pending'],
  archived: [],
}

export function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from] || []).includes(to)
}

export function getAvailableTransitions(current: string): string[] {
  return TRANSITIONS[current] || []
}

export function lifecycleLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Draft', pending: 'Pending Approval', approved: 'Approved',
    active: 'Active', inactive: 'Inactive', archived: 'Archived',
  }
  return labels[status] || status
}

export function lifecycleColor(status: string): string {
  const colors: Record<string, string> = {
    draft:    'bg-gray-800 text-gray-400 border-gray-600',
    pending:  'bg-yellow-900 text-yellow-300 border-yellow-700',
    approved: 'bg-blue-900 text-blue-300 border-blue-700',
    active:   'bg-green-900 text-green-300 border-green-700',
    inactive: 'bg-orange-900 text-orange-300 border-orange-700',
    archived: 'bg-red-900 text-red-300 border-red-700',
  }
  return colors[status] || 'bg-gray-800 text-gray-400 border-gray-600'
}

// Classification masking
const ROLE_VISIBILITY: Record<string, string[]> = {
  admin:  ['public', 'internal', 'confidential', 'sensitive'],
  intern: ['public', 'internal'],
  public: ['public'],
}

export function canViewClassification(role: string, classification: string): boolean {
  return (ROLE_VISIBILITY[role] || ['public']).includes(classification)
}

export function maskValue(value: string, classification: string, role: string): string {
  if (canViewClassification(role, classification)) return value
  if (classification === 'confidential') return value.slice(0, 2) + '****'
  if (classification === 'sensitive') return '••••••••'
  return value
}
