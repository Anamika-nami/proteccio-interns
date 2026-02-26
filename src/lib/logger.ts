import { createClient } from '@/lib/supabase/server'

type LogParams = {
  userId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
}

export async function logActivity({ userId, action, entityType, entityId, metadata = {} }: LogParams) {
  try {
    const supabase = await createClient()
    await supabase.from('activity_logs').insert([{
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    }])
  } catch {
    // Logging is non-critical — never throw
  }
}
