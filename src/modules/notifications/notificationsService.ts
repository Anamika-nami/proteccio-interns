import { createClient } from '@/lib/supabase/server'

export async function createNotification({
  userId, type, message, link
}: {
  userId: string
  type: string
  message: string
  link?: string
}) {
  try {
    const supabase = await createClient()
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('is_read', false)
      .single()
    if (existing) return
    await supabase.from('notifications').insert([{ user_id: userId, type, message, link }])
  } catch {
    // Non-critical
  }
}
