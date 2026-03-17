'use client'
import { useState } from 'react'

interface LearningLogFormProps {
  onSubmit: (data: {
    topic: string
    description: string
    category: string
    tools_used: string[]
    time_spent_hours: number
    evidence_url?: string
  }) => Promise<void>
  onCancel: () => void
}

export function LearningLogForm({ onSubmit, onCancel }: LearningLogFormProps) {
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [toolsUsed, setToolsUsed] = useState<string[]>([])
  const [timeSpentHours, setTimeSpentHours] = useState<number>(1)
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [newTool, setNewTool] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const commonCategories = [
    'Frontend Development',
    'Backend Development',
    'Database Management',
    'DevOps & Deployment',
    'Testing & QA',
    'UI/UX Design',
    'Project Management',
    'Soft Skills',
    'Programming Languages',
    'Frameworks & Libraries',
    'Tools & Technologies',
    'Other'
  ]

  const commonTools = [
    'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Express.js',
    'PostgreSQL', 'MongoDB', 'Supabase', 'Firebase', 'AWS', 'Docker',
    'Git', 'GitHub', 'VS Code', 'Figma', 'Postman', 'Jest', 'Cypress'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim() || !category || timeSpentHours <= 0) return

    setSubmitting(true)
    try {
      await onSubmit({
        topic: topic.trim(),
        description: description.trim(),
        category,
        tools_used: toolsUsed,
        time_spent_hours: timeSpentHours,
        evidence_url: evidenceUrl.trim() || undefined
      })
    } catch (error) {
      console.error('Failed to create learning log:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const addTool = (tool: string) => {
    if (tool && !toolsUsed.includes(tool)) {
      setToolsUsed([...toolsUsed, tool])
    }
  }

  const removeTool = (tool: string) => {
    setToolsUsed(toolsUsed.filter(t => t !== tool))
  }

  const handleAddNewTool = () => {
    if (newTool.trim()) {
      addTool(newTool.trim())
      setNewTool('')
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Log Learning Activity</h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What did you learn? *
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., React Hooks, Database Optimization, API Design..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Select a category</option>
            {commonCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you learned, how you learned it, and what you accomplished..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Time Spent */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Time Spent (hours) *
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="0.1"
              max="24"
              step="0.5"
              value={timeSpentHours}
              onChange={(e) => setTimeSpentHours(parseFloat(e.target.value) || 1)}
              className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              required
            />
            <div className="flex gap-2">
              {[0.5, 1, 2, 4, 8].map(hours => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setTimeSpentHours(hours)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    timeSpentHours === hours
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tools Used */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tools & Technologies Used
          </label>
          
          {/* Selected Tools */}
          {toolsUsed.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {toolsUsed.map(tool => (
                <span
                  key={tool}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
                >
                  {tool}
                  <button
                    type="button"
                    onClick={() => removeTool(tool)}
                    className="text-blue-200 hover:text-white"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Common Tools */}
          <div className="mb-3">
            <div className="text-xs text-gray-400 mb-2">Common tools:</div>
            <div className="flex flex-wrap gap-2">
              {commonTools.filter(tool => !toolsUsed.includes(tool)).map(tool => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => addTool(tool)}
                  className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded hover:bg-gray-600 transition-colors"
                >
                  + {tool}
                </button>
              ))}
            </div>
          </div>

          {/* Add Custom Tool */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTool}
              onChange={(e) => setNewTool(e.target.value)}
              placeholder="Add custom tool..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewTool())}
            />
            <button
              type="button"
              onClick={handleAddNewTool}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Evidence URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Evidence URL (optional)
          </label>
          <input
            type="url"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="Link to project, code, documentation, etc."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <div className="text-xs text-gray-400 mt-1">
            Optional: Link to GitHub repo, deployed project, documentation, or other evidence
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !topic.trim() || !category || timeSpentHours <= 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Logging...
              </div>
            ) : (
              'Log Learning'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}