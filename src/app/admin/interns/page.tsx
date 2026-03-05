'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import { lifecycleColor, lifecycleLabel, getAvailableTransitions } from '@/lib/internWorkflow'
import toast from 'react-hot-toast'

type Intern = {
  id: string; full_name: string; cohort: string; skills: string[]
  approval_status: string; lifecycle_status: string; is_active: boolean
  bio: string | null; created_at: string
}

const LIFECYCLE_STATUSES = ['draft','pending','approved','active','inactive','archived']

function InternsContent() {
  const router = useRouter()
  const [interns, setInterns] = useState<Intern[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'cohort' | 'created'>('created')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<Record<string, any[]>>({})
  const [fieldConfigs, setFieldConfigs] = useState<any[]>([])
  const [showFieldConfig, setShowFieldConfig] = useState(false)
  const PAGE_SIZE = 10

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else { loadInterns(); loadFieldConfigs() }
    })
  }, [])

  useEffect(() => { loadInterns() }, [search, filterStatus, sortBy, page])

  const loadInterns = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      let query = supabase.from('intern_profiles')
        .select('id, full_name, cohort, skills, approval_status, lifecycle_status, is_active, bio, created_at', { count: 'exact' })
        .is('deleted_at', null)

      if (filterStatus !== 'all') query = query.eq('lifecycle_status', filterStatus)
      if (search.trim()) query = query.ilike('full_name', `%${search.trim()}%`)

      if (sortBy === 'name') query = query.order('full_name')
      else if (sortBy === 'cohort') query = query.order('cohort')
      else query = query.order('created_at', { ascending: false })

      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      const { data, count, error } = await query
      if (error) throw error
      setInterns((data || []) as Intern[])
      setTotal(count || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, sortBy, page])

  async function loadFieldConfigs() {
    const res = await fetch('/api/field-config')
    const data = await res.json()
    setFieldConfigs(Array.isArray(data) ? data : [])
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const supabase = createClient()
    const updateData: any = { lifecycle_status: newStatus, status_changed_at: new Date().toISOString() }
    if (newStatus === 'active') { updateData.is_active = true; updateData.approval_status = 'active' }
    if (newStatus === 'inactive') { updateData.is_active = false }
    if (newStatus === 'approved') { updateData.approval_status = 'active' }
    if (newStatus === 'archived') { updateData.is_active = false; updateData.archived_at = new Date().toISOString() }

    const { error } = await supabase.from('intern_profiles').update(updateData).eq('id', id)
    if (error) { toast.error('Update failed'); return }
    toast.success(`Status → ${lifecycleLabel(newStatus)}`)
    loadInterns()
  }

  async function handleBulkAction(action: string) {
    if (selectedIds.length === 0) { toast.error('Select at least one intern'); return }
    setBulkLoading(true)
    const res = await fetch('/api/interns/bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ids: selectedIds })
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(`Updated ${data.updated} intern(s)${data.skipped > 0 ? `, skipped ${data.skipped}` : ''}`)
      setSelectedIds([])
      loadInterns()
    } else toast.error(data.error || 'Bulk action failed')
    setBulkLoading(false)
  }

  async function loadAudit(id: string) {
    if (auditLogs[id]) return
    const res = await fetch(`/api/interns/${id}/audit`)
    const data = await res.json()
    setAuditLogs(prev => ({ ...prev, [id]: Array.isArray(data) ? data : [] }))
  }

  async function saveFieldConfigs() {
    const res = await fetch('/api/field-config', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fieldConfigs)
    })
    if (res.ok) toast.success('Field config saved')
    else toast.error('Save failed')
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const allSelected = interns.length > 0 && interns.every(i => selectedIds.includes(i.id))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-200">Intern Management</h2>
          <p className="text-xs text-gray-500">{total} profiles total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFieldConfig(!showFieldConfig)}
            className="text-xs text-gray-400 border border-gray-700 hover:border-gray-500 px-3 py-2 rounded-lg transition-colors">
            ⚙ Field Config
          </button>
          <a href="/api/export/interns" className="text-xs text-green-400 border border-green-800 hover:border-green-600 px-3 py-2 rounded-lg transition-colors">
            Export CSV
          </a>
        </div>
      </div>

      {/* Field Config Panel */}
      {showFieldConfig && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-300 text-sm mb-4">Field Configuration</h3>
          <div className="space-y-2">
            {fieldConfigs.map((fc, i) => (
              <div key={fc.field_name} className="flex items-center gap-4 py-2 border-b border-gray-800 last:border-0 flex-wrap">
                <span className="text-sm text-gray-300 w-32">{fc.label}</span>
                <label className="flex items-center gap-1.5 text-xs text-gray-400">
                  <input type="checkbox" checked={fc.is_enabled}
                    onChange={e => setFieldConfigs(prev => prev.map((f, j) => j === i ? { ...f, is_enabled: e.target.checked } : f))}
                    className="rounded" />
                  Enabled
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-400">
                  <input type="checkbox" checked={fc.is_required}
                    onChange={e => setFieldConfigs(prev => prev.map((f, j) => j === i ? { ...f, is_required: e.target.checked } : f))}
                    className="rounded" />
                  Required
                </label>
                <select value={fc.classification}
                  onChange={e => setFieldConfigs(prev => prev.map((f, j) => j === i ? { ...f, classification: e.target.value } : f))}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {['public','internal','confidential','sensitive'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${fc.classification === 'sensitive' ? 'bg-red-900 text-red-300 border-red-700' : fc.classification === 'confidential' ? 'bg-orange-900 text-orange-300 border-orange-700' : 'bg-gray-800 text-gray-400 border-gray-600'}`}>
                  {fc.classification}
                </span>
              </div>
            ))}
          </div>
          <button onClick={saveFieldConfigs} className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
            Save Field Config
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name..."
          className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-48" />
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Statuses</option>
          {LIFECYCLE_STATUSES.map(s => <option key={s} value={s}>{lifecycleLabel(s)}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="created">Sort: Newest</option>
          <option value="name">Sort: Name</option>
          <option value="cohort">Sort: Cohort</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-800 rounded-xl px-5 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm text-blue-300">{selectedIds.length} selected</span>
          {[
            { action: 'approve', label: 'Approve', color: 'text-green-400 border-green-800' },
            { action: 'activate', label: 'Activate', color: 'text-blue-400 border-blue-800' },
            { action: 'deactivate', label: 'Deactivate', color: 'text-yellow-400 border-yellow-800' },
            { action: 'archive', label: 'Archive', color: 'text-red-400 border-red-800' },
          ].map(b => (
            <button key={b.action} onClick={() => handleBulkAction(b.action)} disabled={bulkLoading}
              className={`text-xs border px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${b.color}`}>
              {b.label}
            </button>
          ))}
          <button onClick={() => setSelectedIds([])} className="text-xs text-gray-400 hover:text-white ml-auto">Clear</button>
        </div>
      )}

      {/* Intern List */}
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-16 animate-pulse" />)}</div>
      ) : interns.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-xl">
          <p className="text-gray-400">No interns found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select all */}
          <div className="flex items-center gap-3 px-2 pb-1">
            <input type="checkbox" checked={allSelected}
              onChange={e => setSelectedIds(e.target.checked ? interns.map(i => i.id) : [])}
              className="rounded" />
            <span className="text-xs text-gray-500">Select all on this page</span>
          </div>

          {interns.map(intern => (
            <div key={intern.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
              <div className="px-5 py-3.5 flex items-center gap-3 flex-wrap">
                <input type="checkbox" checked={selectedIds.includes(intern.id)}
                  onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, intern.id] : prev.filter(id => id !== intern.id))}
                  className="rounded flex-shrink-0" />
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {intern.full_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-200">{intern.full_name}</p>
                  <p className="text-xs text-gray-500">{intern.cohort} · {new Date(intern.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${lifecycleColor(intern.lifecycle_status)}`}>
                  {lifecycleLabel(intern.lifecycle_status)}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {getAvailableTransitions(intern.lifecycle_status).map(t => (
                    <button key={t} onClick={() => handleStatusChange(intern.id, t)}
                      className={`text-xs border px-2 py-1 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${lifecycleColor(t)}`}>
                      → {lifecycleLabel(t)}
                    </button>
                  ))}
                  <button onClick={() => {
                    setExpandedId(expandedId === intern.id ? null : intern.id)
                    loadAudit(intern.id)
                  }} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2 py-1 rounded transition-colors">
                    {expandedId === intern.id ? '▲ Hide' : '▼ Audit'}
                  </button>
                </div>
              </div>

              {/* Expanded audit trail */}
              {expandedId === intern.id && (
                <div className="border-t border-gray-800 px-5 py-4 bg-gray-950">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Audit Timeline</p>
                  {(auditLogs[intern.id] || []).length === 0 ? (
                    <p className="text-xs text-gray-500">No audit events yet</p>
                  ) : (
                    <div className="space-y-2">
                      {(auditLogs[intern.id] || []).map((log, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                          <span className="text-gray-300">{log.event_type}</span>
                          {log.new_value && <span className="text-blue-400">→ {log.new_value}</span>}
                          <span className="text-gray-600 ml-auto whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {intern.skills && intern.skills.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {intern.skills.map(s => <span key={s} className="bg-gray-800 text-blue-400 text-xs px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Page {page} of {totalPages} · {total} total</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-xs border border-gray-700 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
              ← Prev
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="text-xs border border-gray-700 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white disabled:opacity-40 transition-colors">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InternsPage() {
  return (
    <AppProvider>
      <AppShell role="admin" title="Interns" breadcrumbs={[{ label: 'Admin' }, { label: 'Interns' }]}>
        <InternsContent />
      </AppShell>
    </AppProvider>
  )
}
