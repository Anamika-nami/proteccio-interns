'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AppShell from '@/components/layout/AppShell'
import RuleBuilder from '@/components/automation/RuleBuilder'
import { toast } from 'react-hot-toast'

export default function AutomationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [rules, setRules] = useState<any[]>([])
  const [selectedRule, setSelectedRule] = useState<any>(null)

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  async function checkAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    setLoading(false)
  }

  async function loadData() {
    try {
      const [statsRes, rulesRes] = await Promise.all([
        fetch('/api/automation/dashboard'),
        fetch('/api/automation/rules')
      ])
      
      if (!statsRes.ok || !rulesRes.ok) {
        throw new Error('Failed to load data')
      }

      const statsData = await statsRes.json()
      const rulesData = await rulesRes.json()
      
      setStats(statsData)
      setRules(rulesData.rules || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load automation data')
    }
  }

  async function toggleRule(ruleId: string, currentStatus: boolean) {
    try {
      const response = await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (!response.ok) throw new Error('Failed to update rule')

      toast.success(`Rule ${!currentStatus ? 'activated' : 'deactivated'}`)
      loadData()
    } catch (error) {
      toast.error('Failed to update rule')
    }
  }

  async function executeRule(ruleId: string) {
    try {
      const response = await fetch('/api/automation/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'rule', rule_id: ruleId })
      })

      if (!response.ok) throw new Error('Failed to execute rule')

      const result = await response.json()
      toast.success('Rule executed successfully')
      console.log('Execution result:', result)
    } catch (error) {
      toast.error('Failed to execute rule')
    }
  }

  async function deleteRule(ruleId: string) {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      const response = await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete rule')

      toast.success('Rule deleted successfully')
      loadData()
    } catch (error) {
      toast.error('Failed to delete rule')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading automation system...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell role="admin" title="Workflow Automation">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workflow Automation</h1>
            <p className="text-gray-400 mt-1">Manage automated workflows and rules</p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700"
          >
            Refresh
          </button>
        </div>

        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Total Rules</div>
                  <div className="text-3xl font-bold mt-2">{stats.rules?.total || 0}</div>
                </div>
                <div className="text-4xl">📋</div>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Active Rules</div>
                  <div className="text-3xl font-bold mt-2 text-green-400">{stats.rules?.active || 0}</div>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Executions (24h)</div>
                  <div className="text-3xl font-bold mt-2">{stats.executions?.total || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.executions?.success || 0} success, {stats.executions?.failed || 0} failed
                  </div>
                </div>
                <div className="text-4xl">⚡</div>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Active Alerts</div>
                  <div className="text-3xl font-bold mt-2 text-yellow-400">{stats.alerts?.active || 0}</div>
                </div>
                <div className="text-4xl">🔔</div>
              </div>
            </div>
          </div>
        )}

        {/* Existing Rules */}
        {rules.length > 0 && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Existing Rules ({rules.length})</h2>
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-lg">{rule.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          rule.is_active 
                            ? 'bg-green-900 text-green-300 border border-green-700' 
                            : 'bg-gray-700 text-gray-400 border border-gray-600'
                        }`}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      {rule.description && (
                        <p className="text-sm text-gray-400 mt-1">{rule.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>Type: <span className="text-gray-300">{rule.rule_type}</span></span>
                        <span>Trigger: <span className="text-gray-300">{rule.trigger_type}</span></span>
                        <span>Priority: <span className="text-gray-300">{rule.priority}</span></span>
                        {rule.execution_count > 0 && (
                          <span>Executions: <span className="text-gray-300">{rule.execution_count}</span></span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                        <span>{rule.rule_conditions?.length || 0} conditions</span>
                        <span>•</span>
                        <span>{rule.rule_actions?.length || 0} actions</span>
                        {rule.last_executed_at && (
                          <>
                            <span>•</span>
                            <span>Last run: {new Date(rule.last_executed_at).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => executeRule(rule.id)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                        title="Execute now"
                      >
                        ▶️ Run
                      </button>
                      
                      <button
                        onClick={() => toggleRule(rule.id, rule.is_active)}
                        className={`px-3 py-2 rounded text-sm ${
                          rule.is_active
                            ? 'bg-yellow-600 hover:bg-yellow-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        title={rule.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {rule.is_active ? '⏸️ Pause' : '▶️ Activate'}
                      </button>

                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
                        title="Delete rule"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rule Builder */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Rule</h2>
          <RuleBuilder />
        </div>

        {/* Recent Executions */}
        {stats?.recentExecutions && stats.recentExecutions.length > 0 && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Executions</h2>
            <div className="space-y-2">
              {stats.recentExecutions.map((exec: any) => (
                <div key={exec.id} className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700 text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{exec.automation_rules?.name || 'Unknown Rule'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(exec.executed_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      exec.status === 'success' 
                        ? 'bg-green-900 text-green-300' 
                        : exec.status === 'failed'
                        ? 'bg-red-900 text-red-300'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      {exec.status}
                    </span>
                    <span className="text-gray-500">
                      {exec.actions_executed} actions • {exec.execution_time_ms}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
