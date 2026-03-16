'use client'

import type { FeedbackAnalytics } from '@/types'

interface FeedbackAnalyticsClientProps {
  analytics: FeedbackAnalytics
}

export function FeedbackAnalyticsClient({ analytics }: FeedbackAnalyticsClientProps) {
  const { total_responses, average_ratings, rating_distribution, recent_suggestions } = analytics

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Responses</div>
          <div className="text-3xl font-bold text-blue-600">{total_responses}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Learning Experience</div>
          <div className="text-3xl font-bold text-green-600">
            {average_ratings.learning_experience.toFixed(2)}/5
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Mentorship</div>
          <div className="text-3xl font-bold text-purple-600">
            {average_ratings.mentorship.toFixed(2)}/5
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Program Structure</div>
          <div className="text-3xl font-bold text-orange-600">
            {average_ratings.program_structure.toFixed(2)}/5
          </div>
        </div>
      </div>

      {/* Average Ratings */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Average Ratings</h2>
        <div className="space-y-4">
          {Object.entries(average_ratings).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {value.toFixed(2)}/5
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(value / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Rating Distribution (Learning Experience)
        </h2>
        <div className="space-y-3">
          {rating_distribution.map((item) => (
            <div key={item.rating} className="flex items-center gap-3">
              <div className="w-12 text-sm font-medium text-gray-700">
                {item.rating} ★
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-6">
                <div
                  className="bg-yellow-400 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{
                    width: `${total_responses > 0 ? (item.count / total_responses) * 100 : 0}%`
                  }}
                >
                  {item.count > 0 && (
                    <span className="text-xs font-semibold text-gray-800">
                      {item.count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Suggestions */}
      {recent_suggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Suggestions</h2>
          <div className="space-y-4">
            {recent_suggestions.map((item, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="text-sm font-medium text-gray-900">{item.intern_name}</div>
                <div className="text-gray-700 mt-1">{item.suggestion}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
