'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RatingInput } from '@/components/evaluations/RatingInput'
import toast from 'react-hot-toast'

interface FeedbackFormClientProps {
  internId: string
}

export function FeedbackFormClient({ internId }: FeedbackFormClientProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    learning_experience_rating: 0,
    task_difficulty_rating: 0,
    mentorship_rating: 0,
    program_structure_rating: 0,
    suggestions: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate all ratings are set
    if (
      formData.learning_experience_rating === 0 ||
      formData.task_difficulty_rating === 0 ||
      formData.mentorship_rating === 0 ||
      formData.program_structure_rating === 0
    ) {
      setError('Please provide ratings for all categories')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intern_id: internId,
          ...formData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit feedback')
      }

      toast.success('Feedback submitted successfully')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <RatingInput
          label="Learning Experience"
          value={formData.learning_experience_rating}
          onChange={(value) => setFormData({ ...formData, learning_experience_rating: value })}
          required
        />

        <RatingInput
          label="Task Difficulty"
          value={formData.task_difficulty_rating}
          onChange={(value) => setFormData({ ...formData, task_difficulty_rating: value })}
          required
        />

        <RatingInput
          label="Mentorship Quality"
          value={formData.mentorship_rating}
          onChange={(value) => setFormData({ ...formData, mentorship_rating: value })}
          required
        />

        <RatingInput
          label="Program Structure"
          value={formData.program_structure_rating}
          onChange={(value) => setFormData({ ...formData, program_structure_rating: value })}
          required
        />

        <div>
          <label htmlFor="suggestions" className="block text-sm font-medium text-gray-700">
            Suggestions for Improvement (Optional)
          </label>
          <textarea
            id="suggestions"
            rows={4}
            value={formData.suggestions}
            onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Share your suggestions to help us improve the program..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  )
}
