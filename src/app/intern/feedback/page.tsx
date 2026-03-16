import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FeedbackService } from '@/services/feedbackService'
import { FeedbackFormClient } from './FeedbackFormClient'

export default async function InternFeedbackPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/admin/login')
  }

  // Get intern profile
  const { data: intern } = await supabase
    .from('intern_profiles')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!intern) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Intern profile not found
        </div>
      </div>
    )
  }

  // Check if feedback already submitted
  const feedbackResult = await FeedbackService.getInternFeedback(intern.id)
  const existingFeedback = feedbackResult.feedback

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Program Feedback</h1>
        <p className="text-gray-600 mt-2">
          Share your experience with the internship program
        </p>
      </div>

      {existingFeedback ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Feedback</h2>
            <p className="text-sm text-gray-500">
              Submitted on {new Date(existingFeedback.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Learning Experience</div>
                <div className="text-2xl font-bold text-blue-600">
                  {existingFeedback.learning_experience_rating}/5
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Task Difficulty</div>
                <div className="text-2xl font-bold text-blue-600">
                  {existingFeedback.task_difficulty_rating}/5
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Mentorship</div>
                <div className="text-2xl font-bold text-blue-600">
                  {existingFeedback.mentorship_rating}/5
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Program Structure</div>
                <div className="text-2xl font-bold text-blue-600">
                  {existingFeedback.program_structure_rating}/5
                </div>
              </div>
            </div>

            {existingFeedback.suggestions && (
              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Suggestions:</div>
                <div className="text-gray-600">{existingFeedback.suggestions}</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <FeedbackFormClient internId={intern.id} />
      )}
    </div>
  )
}
