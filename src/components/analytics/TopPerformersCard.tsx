'use client'

interface Performer {
  name: string
  completion_rate: number
  attendance_rate: number
  score: number
}

interface TopPerformersCardProps {
  performers: Performer[]
}

export function TopPerformersCard({ performers }: TopPerformersCardProps) {
  if (!performers || performers.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
          🏆 Top Performers
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-gray-400">No performance data yet</p>
          <p className="text-sm text-gray-500 mt-1">Complete some tasks to see rankings</p>
        </div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 80) return 'text-blue-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-gray-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-900/20 border-green-800'
    if (score >= 80) return 'bg-blue-900/20 border-blue-800'
    if (score >= 70) return 'bg-yellow-900/20 border-yellow-800'
    return 'bg-gray-900/20 border-gray-800'
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇'
      case 1: return '🥈'
      case 2: return '🥉'
      default: return `#${index + 1}`
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
        🏆 Top Performers
      </h3>

      <div className="space-y-3">
        {performers.slice(0, 5).map((performer, index) => (
          <div
            key={performer.name}
            className={`border rounded-lg p-4 hover:border-opacity-80 transition-colors ${getScoreBg(performer.score)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">
                  {getRankIcon(index)}
                </span>
                <div>
                  <p className="font-medium text-gray-200">{performer.name}</p>
                  <p className={`text-sm font-semibold ${getScoreColor(performer.score)}`}>
                    Score: {performer.score}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400">Completion</span>
                  <span className="text-gray-200">{performer.completion_rate}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, performer.completion_rate)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-400">Attendance</span>
                  <span className="text-gray-200">{performer.attendance_rate}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, performer.attendance_rate)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Performance indicators */}
            <div className="flex items-center gap-2 mt-3 text-xs">
              {performer.completion_rate >= 95 && (
                <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded-full">
                  🎯 Task Master
                </span>
              )}
              {performer.attendance_rate >= 98 && (
                <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded-full">
                  📅 Perfect Attendance
                </span>
              )}
              {performer.score >= 95 && (
                <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded-full">
                  ⭐ Excellence
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {performers.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-800 text-center">
          <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            View All Performers ({performers.length}) →
          </button>
        </div>
      )}

      {/* Summary stats */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-lg font-bold text-green-400">
              {performers.filter(p => p.score >= 90).length}
            </div>
            <div className="text-gray-500">Excellent</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-400">
              {performers.filter(p => p.score >= 80 && p.score < 90).length}
            </div>
            <div className="text-gray-500">Good</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-400">
              {performers.filter(p => p.score < 80).length}
            </div>
            <div className="text-gray-500">Improving</div>
          </div>
        </div>
      </div>
    </div>
  )
}