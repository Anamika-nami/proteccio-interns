'use client'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

type Condition = {
  entity_type: string
  field_name: string
  operator: string
  value: any
  condition_group: number
  group_operator: 'AND' | 'OR'
}

type Action = {
  action_type: string
  config: Record<string, any>
}

export default function RuleBuilder() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ruleType, setRuleType] = useState('task_assignment')
  const [triggerType, setTriggerType] = useState('event')
  const [scheduleCron, setScheduleCron] = useState('')
  const [priority, setPriority] = useState(0)
  const [conditions, setConditions] = useState<Condition[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(false)

  const addCondition = () => {
    setConditions([...conditions, {
      entity_type: 'intern',
      field_name: 'status',
      operator: 'equals',
      value: '',
      condition_group: 1,
      group_operator: 'AND'
    }])
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, field: string, value: any) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [field]: value }
    setConditions(updated)
  }

  const addAction = () => {
    setActions([...actions, {
      action_type: 'send_notification',
      config: {}
    }])
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const updateAction = (index: number, field: string, value: any) => {
    const updated = [...actions]
    if (field === 'action_type') {
      updated[index] = { action_type: value, config: {} }
    } else {
      updated[index] = { ...updated[index], config: { ...updated[index].config, [field]: value } }
    }
    setActions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          rule_type: ruleType,
          trigger_type: triggerType,
          schedule_cron: triggerType === 'schedule' ? scheduleCron : undefined,
          priority,
          conditions,
          actions
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create rule')
      }

      toast.success('Rule created successfully')
      // Reset form
      setName('')
      setDescription('')
      setConditions([])
      setActions([])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create rule')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <h2 className="text-xl font-semibold mb-6">Create Automation Rule</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rule Type</label>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
              >
                <option value="task_assignment">Task Assignment</option>
                <option value="notification">Notification</option>
                <option value="status_update">Status Update</option>
                <option value="escalation">Escalation</option>
                <option value="deadline">Deadline</option>
                <option value="document">Document</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Trigger Type</label>
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
              >
                <option value="event">Event-based</option>
                <option value="schedule">Schedule (Cron)</option>
                <option value="condition">Condition-based</option>
              </select>
            </div>
          </div>

          {triggerType === 'schedule' && (
            <div>
              <label className="block text-sm font-medium mb-2">Cron Expression</label>
              <input
                type="text"
                value={scheduleCron}
                onChange={(e) => setScheduleCron(e.target.value)}
                placeholder="0 9 * * * (Daily at 9 AM)"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Priority (higher = executes first)</label>
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            />
          </div>
        </div>

        {/* Conditions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Conditions</h3>
            <button
              type="button"
              onClick={addCondition}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
            >
              Add Condition
            </button>
          </div>

          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="grid grid-cols-4 gap-3">
                  <select
                    value={condition.entity_type}
                    onChange={(e) => updateCondition(index, 'entity_type', e.target.value)}
                    className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  >
                    <option value="intern">Intern</option>
                    <option value="task">Task</option>
                    <option value="attendance">Attendance</option>
                    <option value="worklog">Work Log</option>
                  </select>

                  <input
                    type="text"
                    value={condition.field_name}
                    onChange={(e) => updateCondition(index, 'field_name', e.target.value)}
                    placeholder="Field name"
                    className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  />

                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                    <option value="contains">Contains</option>
                  </select>

                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeCondition(index)}
                  className="mt-2 text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Actions</h3>
            <button
              type="button"
              onClick={addAction}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
            >
              Add Action
            </button>
          </div>

          <div className="space-y-3">
            {actions.map((action, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <select
                  value={action.action_type}
                  onChange={(e) => updateAction(index, 'action_type', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm mb-3"
                >
                  <option value="send_notification">Send Notification</option>
                  <option value="assign_task">Assign Task</option>
                  <option value="update_status">Update Status</option>
                  <option value="create_alert">Create Alert</option>
                  <option value="escalate">Escalate</option>
                </select>

                {action.action_type === 'send_notification' && (
                  <input
                    type="text"
                    placeholder="Notification message"
                    onChange={(e) => updateAction(index, 'message', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm"
                  />
                )}

                <button
                  type="button"
                  onClick={() => removeAction(index)}
                  className="mt-2 text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !name || conditions.length === 0 || actions.length === 0}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium"
        >
          {loading ? 'Creating...' : 'Create Rule'}
        </button>
      </form>
    </div>
  )
}
