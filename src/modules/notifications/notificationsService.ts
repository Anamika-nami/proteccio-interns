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
    await supabase.from('notifications').insert([{ user_id: userId, type, message, link }])
  } catch {
    // Notifications are non-critical — never throw
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient()
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    return count || 0
  } catch {
    return 0
  }
}
