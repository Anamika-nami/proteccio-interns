import { NextResponse } from 'next/server'
import { logActivity } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await logActivity({
      userId: user?.id,
      action: 'User logged in',
      entityType: 'auth',
      metadata: { email }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false })
  }
}
