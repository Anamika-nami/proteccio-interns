'use client'

import { useState } from 'react'
import type { InternReport } from '@/types'
import { BadgeDisplay } from '@/components/profile/BadgeDisplay'
import toast from 'react-hot-toast'

interface InternReportClientProps {
  report: InternReport
}

export function InternReportClient({ report }: InternReportClientProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`/api/reports/${report.intern.id}/export`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `intern_report_${report.intern.full_name.replace(/\s+/g, '_')}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Report exported successfully')
    } catch (error) {
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{report.intern.full_name}</h1>
          <p className="text-gray-600 mt-1">{report.intern.cohort}</p>
          <div className="mt-2">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              report.intern.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              report.intern.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {report.intern.status}
            </span>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isExporting ? 'Exporting...' : 'Export Report'}
        </button>
      </div>

      {/* Intern Overview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="space-y-2">
          <div><span className="font-medium">Joined:</span> {new Date(report.intern.joined_at).toLocaleDateString()}</div>
          {report.intern.bio && <div><span className="font-medium">Bio:</span> {report.intern.bio}</div>}
          <div>
            <span className="font-medium">Skills:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {report.intern.skills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Attendance Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Present Days</div>
            <div className="text-2xl font-bold text-green-600">{report.attendance.present_days}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Absent Days</div>
            <div className="text-2xl font-bold text-red-600">{report.attendance.absent_days}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Attendance Rate</div>
            <div className="text-2xl font-bold text-blue-600">{report.attendance.attendance_percentage}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Hours</div>
            <div className="text-2xl font-bold text-purple-600">{report.attendance.total_hours_worked.toFixed(1)}</div>
          </div>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total Tasks</div>
            <div className="text-2xl font-bold text-gray-900">{report.tasks.total_tasks}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-green-600">{report.tasks.completed_tasks}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="text-2xl font-bold text-yellow-600">{report.tasks.in_progress_tasks}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Completion Rate</div>
            <div className="text-2xl font-bold text-blue-600">{report.tasks.completion_rate}%</div>
          </div>
        </div>
      </div>

      {/* Evaluations */}
      {report.evaluations.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Evaluation Results</h2>
          <div className="space-y-4">
            {report.evaluations.map((evaluation) => (
              <div key={evaluation.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {evaluation.overall_score.toFixed(2)}/5.00
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(evaluation.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {evaluation.feedback && (
                  <div className="mt-2 text-sm text-gray-600">{evaluation.feedback}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {report.badges.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <BadgeDisplay badges={report.badges} />
        </div>
      )}

      {/* Feedback */}
      {report.feedback && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Intern Feedback</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-600">Learning Experience</div>
              <div className="text-2xl font-bold text-blue-600">
                {report.feedback.learning_experience_rating}/5
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Task Difficulty</div>
              <div className="text-2xl font-bold text-blue-600">
                {report.feedback.task_difficulty_rating}/5
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Mentorship</div>
              <div className="text-2xl font-bold text-blue-600">
                {report.feedback.mentorship_rating}/5
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Program Structure</div>
              <div className="text-2xl font-bold text-blue-600">
                {report.feedback.program_structure_rating}/5
              </div>
            </div>
          </div>
          {report.feedback.suggestions && (
            <div className="border-t pt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Suggestions:</div>
              <div className="text-gray-600">{report.feedback.suggestions}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
