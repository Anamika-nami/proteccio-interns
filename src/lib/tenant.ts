import { createClient } from '@/lib/supabase/server'

export const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001'

export async function getOrgIdForUser(userId: string): Promise<string> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', userId)
      .single()
    return (data as any)?.org_id || DEFAULT_ORG_ID
  } catch {
    return DEFAULT_ORG_ID
  }
}

export async function getOrgConfig(orgId: string, key: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('org_id', orgId)
      .eq('key', key)
      .single()
    if (data) return (data as any).value
    // fallback to global config
    const { data: global } = await supabase
      .from('app_config')
      .select('value')
      .is('org_id', null)
      .eq('key', key)
      .single()
    return (global as any)?.value || null
  } catch {
    return null
  }
}

export async function getDataControl(orgId: string, key: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('data_controls')
      .select('control_value')
      .eq('org_id', orgId)
      .eq('control_key', key)
      .single()
    return (data as any)?.control_value || null
  } catch {
    return null
  }
}

// Inject org_id into every query builder - tenant isolation guarantee
export function withTenant<T extends Record<string, any>>(query: T, orgId: string): T {
  return (query as any).eq('org_id', orgId) as T
}
