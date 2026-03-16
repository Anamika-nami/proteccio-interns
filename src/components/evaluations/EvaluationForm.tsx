'use client'

import { useState } from 'react'
import { RatingInput } from './RatingInput'
import type { CreateEvaluationDTO } from '@/types'

interface EvaluationFormProps {
  internId: string
  internName: string
  onSubmit: (data: CreateEvaluationDTO) => Promise<void>
  onCancel: () => void
}

export function EvaluationForm({ internId, internName, onSubmit, onCancel }: EvaluationFormProps) {
  const [formData, setFormData] = useState({
    task_quality_score: 0,
    consistency_score: 0,
    attendance_score: 0,
    communication_score: 0,
    learning_score: 0,
    feedback: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate all scores are set
    if (
      formData.task_quality_score === 0 ||
      formData.consistency_score === 0 ||
      formData.attendance_score === 0 ||
      formData.communication_score === 0 ||
      formData.learning_score === 0
    ) {
      setError('Please provide ratings for all categories')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        intern_id: internId,
        ...formData
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit evaluation')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Evaluate {internName}</h2>
        <p className="mt-1 text-sm text-gray-600">
          Rate the intern's performance across different categories
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <RatingInput
          label="Task Quality"
          value={formData.task_quality_score}
          onChange={(value) => setFormData({ ...formData, task_quality_score: value })}
          required
        />

        <RatingInput
          label="Consistency"
          value={formData.consistency_score}
          onChange={(value) => setFormData({ ...formData, consistency_score: value })}
          required
        />

        <RatingInput
          label="Attendance"
          value={formData.attendance_score}
          onChange={(value) => setFormData({ ...formData, attendance_score: value })}
          required
        />

        <RatingInput
          label="Communication"
          value={formData.communication_score}
          onChange={(value) => setFormData({ ...formData, communication_score: value })}
          required
        />

        <RatingInput
          label="Learning Progress"
          value={formData.learning_score}
          onChange={(value) => setFormData({ ...formData, learning_score: value })}
          required
        />

        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
            Feedback (Optional)
          </label>
          <textarea
            id="feedback"
            rows={4}
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Provide detailed feedback about the intern's performance..."
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
        </button>
      </div>
    </form>
  )
}
