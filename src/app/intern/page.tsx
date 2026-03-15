'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  assigned_to: string | null
  due_date: string | null
  created_by: string | null
  created_at: string
}

type Project = {
  id: string
  title: string
  description: string | null
  tech_stack: string[]
  status: string
  live_url: string | null
  repo_url: string | null
}

export default function InternPortal() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [layout, setLayout] = useState('grid')
  const [loading, setLoading] = useState(true)
  const [consentGiven, setConsentGiven] = useState(true)
  const [givingConsent, setGivingConsent] = useState(false)

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
      setUser(data.user)
      fetchAll()
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        router.push('/admin/login')
      }
    })

    return () => { mounted = false }
  }, [])

  async function fetchAll() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [consentRes, prefsRes] = await Promise.all([
        fetch('/api/consent'),
        fetch('/api/preferences')
      ])
      const consentData = await consentRes.json()
      const prefsData = await prefsRes.json()
      setConsentGiven(consentData.consented === true)
      if (prefsData?.layout) setLayout(prefsData.layout)

      const { data: profileData } = await supabase
        .from('intern_profiles').select('id').eq('user_id', user.id).single()

      if (profileData) {
        const [{ data: taskData }, { data: projectData }] = await Promise.all([
          supabase.from('tasks').select('id, title, description, status, assigned_to, due_date, created_by, created_at').eq('assigned_to', profileData.id).order('created_at', { ascending: false }),
          supabase.from('projects').select('id, title, description, tech_stack, status, live_url, repo_url').is('deleted_at', null).order('created_at', { ascending: false }).limit(6)
        ])

        const fetchedTasks: Task[] = (taskData || []).map((t: any) => ({
          id: t.id, title: t.title, description: t.description ?? null,
          status: t.status, assigned_to: t.assigned_to ?? null,
          due_date: t.due_date ?? null, created_by: t.created_by ?? null, created_at: t.created_at
        }))
        setTasks(fetchedTasks)
        setProjects((projectData || []).map((p: any) => ({
          id: p.id, title: p.title, description: p.description ?? null,
          tech_stack: p.tech_stack || [], status: p.status,
          live_url: p.live_url ?? null, repo_url: p.repo_url ?? null
        })))

        const overdue = fetchedTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done')
        if (overdue.length > 0) {
          fetch('/api/notifications/create', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'task_overdue', message: `You have ${overdue.length} overdue task(s).`, link: '/intern' })
          }).catch(() => {})
        }
      }
    } catch {}
    setLoading(false)
  }

  async function handleConsent() {
    setGivingConsent(true)
    const res = await fetch('/api/consent', { method: 'POST' })
    if (res.ok) { setConsentGiven(true); toast.success('Consent recorded') }
    else toast.error('Failed to record consent')
    setGivingConsent(false)
  }

  async function updateLayout(val: string) {
    setLayout(val)
    fetch('/api/preferences', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout: val })
    }).catch(() => {})
  }

  async function updateTaskStatus(id: string, status: string) {
    const res = await fetch('/api/tasks', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    })
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
      toast.success('Updated!')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading portal...</div>
    </div>
  )

  if (!consentGiven) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
      <div className="max-w-md bg-gray-900 border border-blue-800 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-3">Consent Required</h2>
        <p className="text-gray-400 mb-6 text-sm">Before accessing your portal, you must agree to our data processing policy. Your data is stored securely and never shared without your consent.</p>
        <button onClick={handleConsent} disabled={givingConsent}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
          {givingConsent ? 'Recording...' : 'I Agree - Continue to Portal'}
        </button>
      </div>
    </div>
  )

  const statusColors: Record<string, string> = {
    todo: 'bg-gray-800 text-gray-300',
    in_progress: 'bg-blue-900 text-blue-300',
    done: 'bg-green-900 text-green-300'
  }

  const gridClass = layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-gray-800 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-blue-400">Intern Portal</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Layout:</span>
            {['grid', 'list'].map(l => (
              <button key={l} onClick={() => updateLayout(l)}
                className={`text-xs px-2 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${layout === l ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={async () => { const s = createClient(); await s.auth.signOut(); router.push('/admin/login') }}
            className="text-sm text-red-400 hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
            Logout
          </button>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">My Tasks</h2>
          {tasks.length === 0 ? (
            <div className="text-center py-12 border border-gray-800 rounded-xl">
              <p className="text-gray-500">No tasks assigned yet.</p>
            </div>
          ) : (
            <div className={gridClass}>
              {tasks.map(task => (
                <div key={task.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-medium text-sm">{task.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[task.status] || statusColors.todo}`}>{task.status}</span>
                  </div>
                  {task.description && <p className="text-xs text-gray-400 mb-3">{task.description}</p>}
                  {task.due_date && (
                    <p className={`text-xs mb-3 ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-400' : 'text-gray-500'}`}>
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  )}
                  {task.status !== 'done' && (
                    <div className="flex gap-2">
                      {task.status === 'todo' && (
                        <button onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className="text-xs text-blue-400 border border-blue-800 px-2 py-1 rounded hover:border-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                          Start
                        </button>
                      )}
                      <button onClick={() => updateTaskStatus(task.id, 'done')}
                        className="text-xs text-green-400 border border-green-800 px-2 py-1 rounded hover:border-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500">
                        Done
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Projects</h2>
          {projects.length === 0 ? (
            <div className="text-center py-12 border border-gray-800 rounded-xl">
              <p className="text-gray-500">No projects yet.</p>
            </div>
          ) : (
            <div className={gridClass}>
              {projects.map(project => (
                <div key={project.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-600 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold">{project.title}</p>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{project.status}</span>
                  </div>
                  {project.description && <p className="text-sm text-gray-400 mb-3">{project.description}</p>}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {project.tech_stack.map(t => (
                      <span key={t} className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    {project.live_url && <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">Live</a>}
                    {project.repo_url && <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:underline">Repo</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
