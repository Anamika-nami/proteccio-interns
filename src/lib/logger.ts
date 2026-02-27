import { createClient } from '@/lib/supabase/server'

type LogParams = {
  userId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
  category?: 'action' | 'data_view' | 'data_export' | 'config_change'
}

export async function logActivity({
  userId, action, entityType, entityId, metadata = {}, category = 'action'
}: LogParams) {
  try {
    const supabase = await createClient()
    await supabase.from('activity_logs').insert([{
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      log_category: category
    }])
  } catch {
    // Non-critical — never throw
  }
}
