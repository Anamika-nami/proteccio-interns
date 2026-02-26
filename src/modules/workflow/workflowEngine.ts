import { createClient } from '@/lib/supabase/server'

type Condition = {
  field: string
  operator: 'equals' | 'not_equals' | 'is_null' | 'is_not_null'
  value: unknown
}

type Action = {
  type: 'restrict_login' | 'disable_project_assignment' | 'lock_editing' | 'notify_incomplete'
  message: string
}

type Rule = {
  id: string
  name: string
  trigger_type: string
  condition: Condition
  action: Action
  is_active: boolean
}

export function evaluateCondition(record: Record<string, unknown>, condition: Condition): boolean {
  const fieldValue = record[condition.field]
  switch (condition.operator) {
    case 'equals': return fieldValue === condition.value
    case 'not_equals': return fieldValue !== condition.value
    case 'is_null': return fieldValue === null || fieldValue === undefined
    case 'is_not_null': return fieldValue !== null && fieldValue !== undefined
    default: return false
  }
}

export async function loadRules(triggerType: string): Promise<Rule[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('workflow_rules')
      .select('*')
      .eq('trigger_type', triggerType)
      .eq('is_active', true)
    return (data || []) as Rule[]
  } catch {
    return []
  }
}

export async function runWorkflow(
  triggerType: string,
  record: Record<string, unknown>
): Promise<{ blocked: boolean; message?: string; actions: string[] }> {
  const rules = await loadRules(triggerType)
  const triggeredActions: string[] = []
  let blocked = false
  let blockMessage: string | undefined

  for (const rule of rules) {
    if (evaluateCondition(record, rule.condition)) {
      triggeredActions.push(rule.action.type)
      if (rule.action.type === 'restrict_login' || rule.action.type === 'lock_editing') {
        blocked = true
        blockMessage = rule.action.message
      }
    }
  }

  return { blocked, message: blockMessage, actions: triggeredActions }
}
