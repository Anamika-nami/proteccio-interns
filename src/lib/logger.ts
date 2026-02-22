import { createClient } from '@/lib/supabase/server'

export async function logActivity({ userId, action, entityType, entityId, metadata }: {
  userId?: string, action: string, entityType: string, entityId?: string, metadata?: Record<string, any>
}) {
  try {
    const supabase = await createClient()
    await supabase.from('activity_logs').insert([{
      user_id: userId || null, action, entity_type: entityType,
      entity_id: entityId || null, metadata: metadata || null,
    }])
  } catch {}
}
