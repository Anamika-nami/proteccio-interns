import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { contactSchema } from '@/lib/validations'
import { logActivity } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = contactSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', fields: result.error.flatten().fieldErrors }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('contact_messages').insert([result.data])
    if (error) throw error

    await logActivity({
      userId: '00000000-0000-0000-0000-000000000000',
      action: 'Contact message received',
      entityType: 'contact_message',
      entityId: 'new',
      metadata: { sender_email: result.data.email, subject: result.data.subject },
      category: 'action'
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
