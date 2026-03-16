'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CompletionReviewIntern } from '@/types'
import toast from 'react-hot-toast'

interface CompletionReviewClientProps {
  interns: CompletionReviewIntern[]
}

export function CompletionReviewClient({ interns }: CompletionReviewClientProps) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)

  const handleAction = async (internId: string, action: 'complete' | 'extend' | 'terminate') => {
    setProcessing(internId)

    try {
      const response = await fetch('/api/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intern_id: internId, action })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Action failed')
      }

      toast.success(`Internship ${action}d successfully`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setProcessing(null)
    }
  }

  if (interns.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
        No interns pending completion review
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {interns.map((intern) => (
        <div key={intern.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{intern.full_name}</h3>
              <p className="text-sm text-gray-600">{intern.cohort}</p>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase">Evaluation</div>
                  <div className="text-lg font-semibold">
                    {intern.has_evaluation ? (
                      <span className="text-green-600">
                        {intern.evaluation_score?.toFixed(2) || 'N/A'}/5
                      </span>
                    ) : (
                      <span className="text-red-600">Missing</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">Tasks</div>
                  <div className="text-lg font-semibold">
                    {intern.completed_tasks}/{intern.total_tasks}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">Attendance</div>
                  <div className="text-lg font-semibold">
                    {intern.attendance_percentage.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">Badges</div>
                  <div className="text-lg font-semibold">{intern.badges_earned}</div>
                </div>
              </div>
            </div>

            <div className="ml-6 flex flex-col gap-2">
              <button
                onClick={() => handleAction(intern.id, 'complete')}
                disabled={processing === intern.id || !intern.has_evaluation}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title={!intern.has_evaluation ? 'Evaluation required' : ''}
              >
                {processing === intern.id ? 'Processing...' : 'Complete'}
              </button>
              <button
                onClick={() => handleAction(intern.id, 'extend')}
                disabled={processing === intern.id}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                Extend
              </button>
              <button
                onClick={() => handleAction(intern.id, 'terminate')}
                disabled={processing === intern.id}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                Terminate
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
