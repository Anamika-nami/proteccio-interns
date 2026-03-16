'use client'

import type { InternEvaluation } from '@/types'

interface EvaluationHistoryProps {
  evaluations: InternEvaluation[]
}

export function EvaluationHistory({ evaluations }: EvaluationHistoryProps) {
  if (evaluations.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
        No evaluations yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Evaluation History</h3>
      
      {evaluations.map((evaluation) => (
        <div key={evaluation.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {evaluation.overall_score.toFixed(2)}/5.00
              </div>
              <div className="text-sm text-gray-500">
                {new Date(evaluation.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500 uppercase">Task Quality</div>
              <div className="text-lg font-semibold">{evaluation.task_quality_score}/5</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Consistency</div>
              <div className="text-lg font-semibold">{evaluation.consistency_score}/5</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Attendance</div>
              <div className="text-lg font-semibold">{evaluation.attendance_score}/5</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Communication</div>
              <div className="text-lg font-semibold">{evaluation.communication_score}/5</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Learning</div>
              <div className="text-lg font-semibold">{evaluation.learning_score}/5</div>
            </div>
          </div>

          {evaluation.feedback && (
            <div className="border-t pt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Feedback:</div>
              <div className="text-sm text-gray-600">{evaluation.feedback}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
