import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { contactSchema } from '@/lib/validations'
import { rateLimit, getIP } from '@/lib/rate-limit'
import { logActivity } from '@/lib/logger'

export async function POST(request: Request) {
  const ip = getIP(request)
  if (!rateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const result = contactSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', fields: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { error } = await supabase.from('contact_messages').insert([result.data])
    if (error) throw error

    await logActivity({
      action: 'Contact message received',
      entityType: 'contact_message',
      metadata: { sender_email: result.data.email, subject: result.data.subject }
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
