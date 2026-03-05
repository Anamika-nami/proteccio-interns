import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('intern_documents').select('*').eq('intern_id', id).order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    if (!body.doc_type || !body.file_name || !body.file_url) {
      return NextResponse.json({ error: 'doc_type, file_name, file_url required' }, { status: 400 })
    }

    const ALLOWED_TYPES = ['offer_letter', 'id_proof', 'agreement', 'completion_certificate', 'other']
    if (!ALLOWED_TYPES.includes(body.doc_type)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    const { data, error } = await supabase.from('intern_documents').insert({
      intern_id: id, uploaded_by: user.id,
      doc_type: body.doc_type, file_name: body.file_name,
      file_url: body.file_url, file_size: body.file_size || null,
      mime_type: body.mime_type || null, is_mandatory: body.is_mandatory || false,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { doc_id, verification_status, rejection_reason } = await req.json()
    if (!['verified', 'rejected', 'pending'].includes(verification_status)) {
      return NextResponse.json({ error: 'Invalid verification status' }, { status: 400 })
    }

    const update: any = { verification_status }
    if (verification_status === 'verified') { update.verified_by = user.id; update.verified_at = new Date().toISOString() }
    if (verification_status === 'rejected') { update.rejection_reason = rejection_reason || 'Not specified' }

    const { data, error } = await supabase.from('intern_documents')
      .update(update).eq('id', doc_id).eq('intern_id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
