import { createClient } from '@/lib/supabase/client'
import type { Intern } from '@/types'

export async function fetchInterns(params: {
  search?: string
  status?: string
  page?: number
  limit?: number
}) {
  const { search = '', status = 'active', page = 1, limit = 9 } = params
  const query = new URLSearchParams({ search, status, page: String(page), limit: String(limit) })
  const res = await fetch(`/api/interns?${query}`)
  if (!res.ok) throw new Error('Failed to fetch interns')
  return res.json()
}

export async function softDeleteIntern(id: string) {
  const res = await fetch(`/api/interns/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete' })
  })
  if (!res.ok) throw new Error('Failed to delete intern')
  return res.json()
}

export async function restoreIntern(id: string) {
  const res = await fetch(`/api/interns/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'restore' })
  })
  if (!res.ok) throw new Error('Failed to restore intern')
  return res.json()
}

export async function approveIntern(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('intern_profiles')
    .update({ approval_status: 'active', is_active: true })
    .eq('id', id)
  if (error) throw error
}

export async function rejectIntern(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('intern_profiles')
    .update({ approval_status: 'rejected', is_active: false })
    .eq('id', id)
  if (error) throw error
}
