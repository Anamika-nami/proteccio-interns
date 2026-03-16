'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import { lifecycleColor, lifecycleLabel } from '@/lib/internWorkflow'
import toast from 'react-hot-toast'

type Tab = 'tasks' | 'tenure' | 'documents' | 'performance' | 'skills'

function InternDetailContent() {
  const router = useRouter()
  const params = useParams()
  const internId = params.id as string
  const [tab, setTab] = useState<Tab>('tasks')
  const [intern, setIntern] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [skills, setSkills] = useState<any[]>([])
  const [performance, setPerformance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Task form
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', is_recurring: false })
  const [showTaskForm, setShowTaskForm] = useState(false)

  // Tenure form
  const [tenureForm, setTenureForm] = useState({ tenure_start: '', tenure_end: '', grace_period_days: 7 })
  const [extendDate, setExtendDate] = useState('')

  // Doc form
  const [docForm, setDocForm] = useState({ doc_type: 'offer_letter', file_name: '', file_url: '', is_mandatory: false })
  const [showDocForm, setShowDocForm] = useState(false)

  // Skill form
  const [skillForm, setSkillForm] = useState({ skill_name: '', proficiency: 'beginner', portfolio_url: '' })
  const [showSkillForm, setShowSkillForm] = useState(false)

  // Performance form
  const [perfForm, setPerfForm] = useState({ performance_rating: '', performance_remarks: '', certificate_eligible: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error || !data.user) {
        setLoading(false)
        router.push('/admin/login')
        return
      }
      loadAll()
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        router.push('/admin/login')
      }
    })

    return () => { mounted = false }
  }, [internId])

  async function loadAll() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: internData } = await supabase.from('intern_profiles')
        .select('*').eq('id', internId).single()
      setIntern(internData)
      if (internData) {
        setTenureForm({
          tenure_start: internData.tenure_start || '',
          tenure_end: internData.tenure_end || '',
          grace_period_days: internData.grace_period_days || 7,
        })
        setPerfForm({
          performance_rating: internData.performance_rating || '',
          performance_remarks: internData.performance_remarks || '',
          certificate_eligible: internData.certificate_eligible || false,
        })
      }
      const [tasksRes, docsRes, skillsRes, perfRes] = await Promise.all([
        fetch(`/api/interns/${internId}/tasks`).then(r => r.json()),
        fetch(`/api/interns/${internId}/documents`).then(r => r.json()),
        fetch(`/api/interns/${internId}/skills`).then(r => r.json()),
        fetch(`/api/interns/${internId}/performance`).then(r => r.json()),
      ])
      setTasks(Array.isArray(tasksRes) ? tasksRes : [])
      setDocuments(Array.isArray(docsRes) ? docsRes : [])
      setSkills(Array.isArray(skillsRes) ? skillsRes : [])
      setPerformance(perfRes)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function addTask() {
    if (!taskForm.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    const res = await fetch(`/api/interns/${internId}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskForm)
    })
    if (res.ok) { toast.success('Task assigned'); setTaskForm({ title: '', description: '', priority: 'medium', due_date: '', is_recurring: false }); setShowTaskForm(false); loadAll() }
    else toast.error('Failed')
    setSaving(false)
  }

  async function updateTaskStatus(taskId: string, status: string) {
    const res = await fetch(`/api/interns/${internId}/tasks`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, status })
    })
    if (res.ok) { toast.success('Updated'); loadAll() }
    else toast.error('Failed')
  }

  async function saveTenure(action: string, extra?: any) {
    setSaving(true)
    const body = action === 'set' ? { action, ...tenureForm }
      : action === 'extend' ? { action, new_end_date: extendDate }
      : { action }
    const res = await fetch(`/api/interns/${internId}/tenure`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (res.ok) { toast.success('Tenure updated'); loadAll() }
    else { const e = await res.json(); toast.error(e.error || 'Failed') }
    setSaving(false)
  }

  async function addDocument() {
    if (!docForm.file_name.trim() || !docForm.file_url.trim()) { toast.error('File name and URL required'); return }
    setSaving(true)
    const res = await fetch(`/api/interns/${internId}/documents`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(docForm)
    })
    if (res.ok) { toast.success('Document added'); setShowDocForm(false); loadAll() }
    else toast.error('Failed')
    setSaving(false)
  }

  async function verifyDocument(docId: string, status: string) {
    const res = await fetch(`/api/interns/${internId}/documents`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doc_id: docId, verification_status: status })
    })
    if (res.ok) { toast.success('Document ' + status); loadAll() }
    else toast.error('Failed')
  }

  async function addSkill() {
    if (!skillForm.skill_name.trim()) { toast.error('Skill name required'); return }
    setSaving(true)
    const res = await fetch(`/api/interns/${internId}/skills`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(skillForm)
    })
    if (res.ok) { toast.success('Skill added'); setShowSkillForm(false); setSkillForm({ skill_name: '', proficiency: 'beginner', portfolio_url: '' }); loadAll() }
    else toast.error('Failed')
    setSaving(false)
  }

  async function approveSkill(skillId: string, approve: boolean) {
    const res = await fetch(`/api/interns/${internId}/skills`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_id: skillId, action: approve ? 'approve' : 'revoke' })
    })
    if (res.ok) { toast.success(approve ? 'Skill approved' : 'Approval revoked'); loadAll() }
    else toast.error('Failed')
  }

  async function savePerformance() {
    setSaving(true)
    const res = await fetch(`/api/interns/${internId}/performance`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...perfForm, performance_rating: perfForm.performance_rating ? Number(perfForm.performance_rating) : undefined })
    })
    if (res.ok) { toast.success('Performance saved'); loadAll() }
    else { const e = await res.json(); toast.error(e.error || 'Failed') }
    setSaving(false)
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'tenure', label: 'Tenure', icon: '📅' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'performance', label: 'Performance', icon: '📊' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
  ]

  const priorityColor: Record<string, string> = {
    low: 'text-gray-400 border-gray-600', medium: 'text-blue-400 border-blue-800',
    high: 'text-yellow-400 border-yellow-800', urgent: 'text-red-400 border-red-800'
  }
  const taskStatusColor: Record<string, string> = {
    pending: 'bg-gray-800 text-gray-300', in_progress: 'bg-blue-900 text-blue-300',
    completed: 'bg-green-900 text-green-300', reviewed: 'bg-purple-900 text-purple-300'
  }
  const docStatusColor: Record<string, string> = {
    pending: 'text-yellow-400 border-yellow-800', verified: 'text-green-400 border-green-800', rejected: 'text-red-400 border-red-800'
  }
  const proficiencyColor: Record<string, string> = {
    beginner: 'bg-gray-800 text-gray-300', intermediate: 'bg-blue-900 text-blue-300',
    advanced: 'bg-purple-900 text-purple-300', expert: 'bg-green-900 text-green-300'
  }

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-20 animate-pulse" />)}</div>
  if (!intern) return <div className="text-center py-16"><p className="text-gray-400">Intern not found</p></div>

  return (
    <div className="space-y-6">
      {/* Intern Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
          {intern.full_name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-200">{intern.full_name}</h2>
          <p className="text-sm text-gray-400">{intern.cohort} · {intern.bio || 'No bio'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${lifecycleColor(intern.status || 'draft')}`}>
            {lifecycleLabel(intern.status || 'draft')}
          </span>
          {intern.tenure_status && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-indigo-900 text-indigo-300 border-indigo-700">
              Tenure: {intern.tenure_status}
            </span>
          )}
          {intern.certificate_eligible && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-yellow-900 text-yellow-300 border-yellow-700">🏆 Cert Eligible</span>
          )}
        </div>
        <button onClick={() => router.push('/admin/interns')} className="text-xs text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded-lg transition-colors">
          ← Back
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t ${tab === t.id ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TASKS ── */}
      {tab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">{tasks.length} tasks assigned</p>
            <button onClick={() => setShowTaskForm(!showTaskForm)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
              {showTaskForm ? 'Cancel' : '+ Assign Task'}
            </button>
          </div>

          {showTaskForm && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Task Title *</label>
                <input value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Review PR #42"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Optional details"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                <select value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Due Date</label>
                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input type="checkbox" checked={taskForm.is_recurring} onChange={e => setTaskForm(p => ({ ...p, is_recurring: e.target.checked }))} />
                <label className="text-xs text-gray-400">Recurring task</label>
              </div>
              <div className="md:col-span-2">
                <button onClick={addTask} disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                  {saving ? 'Saving...' : 'Assign Task'}
                </button>
              </div>
            </div>
          )}

          {tasks.length === 0 ? (
            <div className="text-center py-12 border border-gray-800 rounded-xl"><p className="text-gray-400 text-sm">No tasks assigned yet</p></div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3.5 flex items-center gap-3 flex-wrap hover:border-gray-600 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-gray-200">{task.title}</p>
                      <span className={`text-xs border px-2 py-0.5 rounded-full ${priorityColor[task.priority]}`}>{task.priority}</span>
                      {task.is_recurring && <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded-full">recurring</span>}
                    </div>
                    {task.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>}
                    {task.due_date && <p className="text-xs text-gray-500 mt-0.5">Due: {task.due_date}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${taskStatusColor[task.status]}`}>{task.status.replace('_', ' ')}</span>
                  <select value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                    {['pending','in_progress','completed','reviewed'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TENURE ── */}
      {tab === 'tenure' && (
        <div className="space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-300 text-sm mb-4">Set / Update Tenure</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
                <input type="date" value={tenureForm.tenure_start} onChange={e => setTenureForm(p => ({ ...p, tenure_start: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">End Date</label>
                <input type="date" value={tenureForm.tenure_end} onChange={e => setTenureForm(p => ({ ...p, tenure_end: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Grace Period (days)</label>
                <input type="number" value={tenureForm.grace_period_days} onChange={e => setTenureForm(p => ({ ...p, grace_period_days: Number(e.target.value) }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <button onClick={() => saveTenure('set')} disabled={saving}
              className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {saving ? 'Saving...' : 'Save Tenure'}
            </button>
          </div>

          {intern.tenure_start && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-gray-300 text-sm mb-4">Tenure Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { label: 'Start', value: intern.tenure_start || '—' },
                  { label: 'End', value: intern.tenure_end || '—' },
                  { label: 'Status', value: intern.tenure_status || '—' },
                  { label: 'Grace Period', value: `${intern.grace_period_days || 7} days` },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-xs text-gray-500 mb-1">{f.label}</p>
                    <p className="text-sm text-gray-200">{f.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <input type="date" value={extendDate} onChange={e => setExtendDate(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={() => saveTenure('extend')} disabled={!extendDate || saving}
                    className="text-sm text-blue-400 border border-blue-800 hover:border-blue-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                    Extend
                  </button>
                </div>
                <button onClick={() => saveTenure('complete')} disabled={saving}
                  className="text-sm text-green-400 border border-green-800 hover:border-green-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                  Mark Completed
                </button>
                <button onClick={() => saveTenure('terminate')} disabled={saving}
                  className="text-sm text-red-400 border border-red-900 hover:border-red-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                  Terminate
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DOCUMENTS ── */}
      {tab === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">{documents.length} documents</p>
            <button onClick={() => setShowDocForm(!showDocForm)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
              {showDocForm ? 'Cancel' : '+ Add Document'}
            </button>
          </div>

          {showDocForm && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Document Type</label>
                <select value={docForm.doc_type} onChange={e => setDocForm(p => ({ ...p, doc_type: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['offer_letter','id_proof','agreement','completion_certificate','other'].map(d => (
                    <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">File Name</label>
                <input value={docForm.file_name} onChange={e => setDocForm(p => ({ ...p, file_name: e.target.value }))} placeholder="e.g. offer_letter.pdf"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">File URL (Supabase Storage URL)</label>
                <input value={docForm.file_url} onChange={e => setDocForm(p => ({ ...p, file_url: e.target.value }))} placeholder="https://..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input type="checkbox" checked={docForm.is_mandatory} onChange={e => setDocForm(p => ({ ...p, is_mandatory: e.target.checked }))} />
                <label className="text-xs text-gray-400">Mandatory document</label>
              </div>
              <div className="md:col-span-2">
                <button onClick={addDocument} disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                  {saving ? 'Saving...' : 'Save Document'}
                </button>
              </div>
            </div>
          )}

          {documents.length === 0 ? (
            <div className="text-center py-12 border border-gray-800 rounded-xl"><p className="text-gray-400 text-sm">No documents uploaded</p></div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3.5 flex items-center gap-3 flex-wrap hover:border-gray-600 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-200">{doc.file_name}</p>
                    <p className="text-xs text-gray-500">{doc.doc_type.replace(/_/g, ' ')} {doc.is_mandatory ? '· mandatory' : ''}</p>
                  </div>
                  <span className={`text-xs border px-2 py-0.5 rounded-full ${docStatusColor[doc.verification_status]}`}>
                    {doc.verification_status}
                  </span>
                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 border border-blue-800 px-2 py-1 rounded transition-colors">View</a>
                  {doc.verification_status !== 'verified' && (
                    <button onClick={() => verifyDocument(doc.id, 'verified')} className="text-xs text-green-400 border border-green-800 px-2 py-1 rounded hover:border-green-600 transition-colors">Verify</button>
                  )}
                  {doc.verification_status !== 'rejected' && (
                    <button onClick={() => verifyDocument(doc.id, 'rejected')} className="text-xs text-red-400 border border-red-900 px-2 py-1 rounded hover:border-red-700 transition-colors">Reject</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PERFORMANCE ── */}
      {tab === 'performance' && (
        <div className="space-y-5">
          {performance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Task Completion', value: `${performance.task_completion_pct || 0}%`, color: 'text-blue-400' },
                { label: 'Tasks Done', value: `${performance.completed_tasks || 0}/${performance.total_tasks || 0}`, color: 'text-green-400' },
                { label: 'Attendance', value: `${performance.attendance_pct || 0}%`, color: 'text-purple-400' },
                { label: 'Performance Rating', value: performance.performance_rating ? `${performance.performance_rating}/10` : '—', color: 'text-yellow-400' },
              ].map(m => (
                <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">{m.label}</p>
                  <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-gray-300 text-sm">Admin Performance Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Performance Rating (0–10)</label>
                <input type="number" min="0" max="10" step="0.1" value={perfForm.performance_rating}
                  onChange={e => setPerfForm(p => ({ ...p, performance_rating: e.target.value }))}
                  placeholder="e.g. 8.5"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex items-center gap-2 mt-5">
                <input type="checkbox" checked={perfForm.certificate_eligible} onChange={e => setPerfForm(p => ({ ...p, certificate_eligible: e.target.checked }))} />
                <label className="text-sm text-gray-300">Certificate Eligible 🏆</label>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Performance Remarks</label>
                <textarea value={perfForm.performance_remarks} onChange={e => setPerfForm(p => ({ ...p, performance_remarks: e.target.value }))}
                  rows={3} placeholder="Admin remarks on performance..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <button onClick={savePerformance} disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {saving ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>
        </div>
      )}

      {/* ── SKILLS ── */}
      {tab === 'skills' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">{skills.length} skills</p>
            <button onClick={() => setShowSkillForm(!showSkillForm)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
              {showSkillForm ? 'Cancel' : '+ Add Skill'}
            </button>
          </div>

          {showSkillForm && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Skill Name</label>
                <input value={skillForm.skill_name} onChange={e => setSkillForm(p => ({ ...p, skill_name: e.target.value }))} placeholder="e.g. React"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Proficiency</label>
                <select value={skillForm.proficiency} onChange={e => setSkillForm(p => ({ ...p, proficiency: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['beginner','intermediate','advanced','expert'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Portfolio URL</label>
                <input value={skillForm.portfolio_url} onChange={e => setSkillForm(p => ({ ...p, portfolio_url: e.target.value }))} placeholder="https://github.com/..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-3">
                <button onClick={addSkill} disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                  {saving ? 'Saving...' : 'Add Skill'}
                </button>
              </div>
            </div>
          )}

          {skills.length === 0 ? (
            <div className="text-center py-12 border border-gray-800 rounded-xl"><p className="text-gray-400 text-sm">No skills added yet</p></div>
          ) : (
            <div className="space-y-2">
              {skills.map(skill => (
                <div key={skill.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3.5 flex items-center gap-3 flex-wrap hover:border-gray-600 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-200">{skill.skill_name}</p>
                    {skill.portfolio_url && (
                      <a href={skill.portfolio_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300">{skill.portfolio_url}</a>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${proficiencyColor[skill.proficiency]}`}>{skill.proficiency}</span>
                  {skill.is_approved ? (
                    <span className="text-xs text-green-400 border border-green-800 px-2 py-0.5 rounded-full">✓ Approved</span>
                  ) : (
                    <span className="text-xs text-yellow-400 border border-yellow-800 px-2 py-0.5 rounded-full">Pending</span>
                  )}
                  <button onClick={() => approveSkill(skill.id, !skill.is_approved)}
                    className={`text-xs border px-2 py-1 rounded transition-colors ${skill.is_approved ? 'text-red-400 border-red-900 hover:border-red-700' : 'text-green-400 border-green-800 hover:border-green-600'}`}>
                    {skill.is_approved ? 'Revoke' : 'Approve'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function InternDetailPage() {
  return (
    <AppProvider>
      <AppShell role="admin" title="Intern Detail" breadcrumbs={[{ label: 'Admin' }, { label: 'Interns', path: '/admin/interns' }, { label: 'Detail' }]}>
        <InternDetailContent />
      </AppShell>
    </AppProvider>
  )
}
