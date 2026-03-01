import { createClient } from '@/lib/supabase/server'

type PermissionData = {
  can_create?: boolean
  can_read?: boolean
  can_update?: boolean
  can_delete?: boolean
}

export async function getUserRole(userId: string): Promise<string> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
    return (data as any)?.role || 'public'
  } catch {
    return 'public'
  }
}

export async function checkFeature(featureKey: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', featureKey)
      .single()
    return (data as any)?.value === 'true'
  } catch {
    return true
  }
}

export async function checkPermission(
  role: string,
  resource: string,
  action: 'can_create' | 'can_read' | 'can_update' | 'can_delete'
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('role_permissions')
      .select('can_create, can_read, can_update, can_delete')
      .eq('role', role)
      .eq('resource', resource)
      .single()
    return (data as PermissionData)?.[action] === true
  } catch {
    return true
  }
}