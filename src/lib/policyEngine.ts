import { createClient } from '@/lib/supabase/server'

type Policy = {
  id: string
  name: string
  condition_field: string
  condition_op: string
  condition_value: string | null
  action: string
  action_params: Record<string, any>
  priority: number
}

type PolicyContext = {
  orgId: string
  record: Record<string, any>
  action: string
}

type PolicyResult = {
  allowed: boolean
  action?: string
  params?: Record<string, any>
  policyName?: string
}

export async function evaluatePolicies(context: PolicyContext): Promise<PolicyResult> {
  try {
    const supabase = await createClient()
    const { data: policies } = await supabase
      .from('policies')
      .select('*')
      .eq('org_id', context.orgId)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    for (const policy of (policies || []) as Policy[]) {
      if (matchesCondition(policy, context.record)) {
        if (policy.action === 'block') return { allowed: false, action: 'block', policyName: policy.name }
        if (policy.action === 'require_approval') return { allowed: false, action: 'require_approval', params: policy.action_params, policyName: policy.name }
        return { allowed: true, action: policy.action, params: policy.action_params, policyName: policy.name }
      }
    }
    return { allowed: true }
  } catch {
    return { allowed: true }
  }
}

function matchesCondition(policy: Policy, record: Record<string, any>): boolean {
  const fieldValue = record[policy.condition_field]
  const condValue = policy.condition_value
  switch (policy.condition_op) {
    case 'equals': return String(fieldValue) === condValue
    case 'not_equals': return String(fieldValue) !== condValue
    case 'greater_than': return Number(fieldValue) > Number(condValue)
    case 'less_than': return Number(fieldValue) < Number(condValue)
    case 'is_null': return fieldValue == null
    case 'is_not_null': return fieldValue != null
    case 'days_since': {
      if (!fieldValue) return false
      const days = (Date.now() - new Date(fieldValue).getTime()) / (1000 * 60 * 60 * 24)
      return days >= Number(condValue)
    }
    default: return false
  }
}
