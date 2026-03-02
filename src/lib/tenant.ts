import { createClient } from '@/lib/supabase/server'

export async function getOrgIdForUser(userId: string): Promise<string> {
  const DEFAULT_ORG = '00000000-0000-0000-0000-000000000001'
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('users').select('org_id').eq('id', userId).single()
    return (data as any)?.org_id || DEFAULT_ORG
  } catch {
    return DEFAULT_ORG
  }
}

export async function getOrgConfig(orgId: string, key: string, fallback = ''): Promise<string> {
  try {
    const supabase = await createClient()
    const { data: orgData } = await supabase
      .from('app_config').select('value').eq('org_id', orgId).eq('key', key).single()
    if ((orgData as any)?.value !== undefined) return (orgData as any).value
    const { data: globalData } = await supabase
      .from('app_config').select('value').is('org_id', null).eq('key', key).single()
    return (globalData as any)?.value ?? fallback
  } catch {
    return fallback
  }
}

export async function getDataControl(orgId: string, key: string, fallback = 'true'): Promise<string> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('data_controls').select('control_value').eq('org_id', orgId).eq('control_key', key).single()
    return (data as any)?.control_value ?? fallback
  } catch {
    return fallback
  }
}

export function withTenant<T extends { eq: Function }>(query: T, orgId: string): T {
  return query.eq('org_id', orgId) as T
}
