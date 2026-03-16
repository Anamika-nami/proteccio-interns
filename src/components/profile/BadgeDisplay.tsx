'use client'

import type { InternBadgeWithDetails } from '@/types'

interface BadgeDisplayProps {
  badges: InternBadgeWithDetails[]
}

export function BadgeDisplay({ badges }: BadgeDisplayProps) {
  if (badges.length === 0) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
        No badges earned yet. Keep up the good work!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-lg shadow border-2 border-yellow-200 hover:border-yellow-400 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="text-4xl">{item.badge.icon || '🏅'}</div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.badge.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.badge.description}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Earned {new Date(item.earned_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
