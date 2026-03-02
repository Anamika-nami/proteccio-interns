import { createClient } from '@/lib/supabase/server'

type PolicyContext = {
  orgId: string
  record: Record<string, any>
  action: string
}

type PolicyResult = {
  allowed: boolean
  reason?: string
  requiresApproval?: boolean
  policyName?: string
}

export async function evaluatePolicies(ctx: PolicyContext): Promise<PolicyResult> {
  try {
    const supabase = await createClient()
    const { data: policies } = await supabase
      .from('policies')
      .select('*')
      .eq('org_id', ctx.orgId)
      .eq('is_active', true)
      .order('priority', { ascending: true })

    if (!policies || policies.length === 0) return { allowed: true }

    for (const policy of policies as any[]) {
      if (!matchesCondition(policy, ctx.record)) continue

      if (policy.action === 'require_approval') {
        return { allowed: false, requiresApproval: true, reason: policy.description, policyName: policy.name }
      }
      if (policy.action === 'block') {
        return { allowed: false, reason: policy.description, policyName: policy.name }
      }
      if (policy.action === 'disable_account') {
        return { allowed: false, reason: policy.description, policyName: policy.name }
      }
      if (policy.action === 'expire_profile') {
        return { allowed: false, reason: policy.description, policyName: policy.name }
      }
    }
    return { allowed: true }
  } catch {
    return { allowed: true }
  }
}

function matchesCondition(policy: any, record: Record<string, any>): boolean {
  if (!policy.condition_field || !policy.condition_op) return false
  const value = record[policy.condition_field]
  const target = policy.condition_value

  switch (policy.condition_op) {
    case 'equals':       return String(value) === String(target)
    case 'not_equals':   return String(value) !== String(target)
    case 'greater_than': return Number(value) > Number(target)
    case 'less_than':    return Number(value) < Number(target)
    case 'is_null':      return value == null
    case 'is_not_null':  return value != null
    case 'days_since': {
      if (!value) return false
      const days = (Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24)
      return days >= Number(target)
    }
    default: return false
  }
}

export async function getPolicies(orgId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('policies')
    .select('*')
    .eq('org_id', orgId)
    .order('priority', { ascending: true })
  return data || []
}
