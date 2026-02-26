'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Project, Task, UserPreferences } from '@/types'

export default function InternPortal() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [noProfile, setNoProfile] = useState(false)
  const [prefs, setPrefs] = useState<UserPreferences>({ theme: 'dark', layout: 'grid' })
  const [savingPref, setSavingPref] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else {
        setUser(data.user)
        fetchData(data.user.id)
        fetchPrefs()
      }
    })
  }, [])

  async function fetchPrefs() {
    const res = await fetch('/api/preferences')
    const data = await res.json()
    setPrefs(data)
  }

  async function updatePref(key: keyof UserPreferences, value: string) {
    setSavingPref(true)
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    })
    setSavingPref(false)
  }

  async function fetchData(userId: string) {
    const supabase = createClient()

    const { data: internProfile } = await supabase
      .from('intern_profiles')
      .select('id, full_name, cohort, skills, bio, approval_status')
      .eq('user_id', userId)
      .single()

    if (!internProfile) { setNoProfile(true); setLoading(false); return }
    setProfile(internProfile)

    const { data: projectLinks } = await supabase
      .from('project_interns')
      .select('project_id')
      .eq('intern_id', internProfile.id)

    if (projectLinks && projectLinks.length > 0) {
      const projectIds = projectLinks.map((p: any) => p.project_id)
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, title, description, tech_stack, status, live_url, repo_url')
        .in('id', projectIds)
      setProjects((projectData || []) as Project[])
    }

    const { data: taskData } = await supabase
      .from('tasks')
      .select('id, title, description, status, priority, due_date')
      .eq('assigned_to', internProfile.id)
      .order('created_at', { ascending: false })
    setTasks((taskData || []) as Task[])

    // Check for overdue tasks and notify
    const overdue = (taskData || []).filter((t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done')
    if (overdue.length > 0) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: false })
      })
      // Create overdue notification via API
      await fetch('/api/notifications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'task_overdue', message: `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}.`, link: '/intern' })
      })
    }

    setLoading(false)
  }

  async function updateTaskStatus(taskId: string, newStatus: string) {
    const supabase = createClient()
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    if (!error) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t))
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const isDark = prefs.theme === 'dark'
  const bg = isDark ? 'bg-gray-950' : 'bg-gray-50'
  const text = isDark ? 'text-white' : 'text-gray-900'
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const subtext = isDark ? 'text-gray-400' : 'text-gray-500'

  if (!user) return (
    <div className={`min-h-screen ${bg} ${text} flex items-center justify-center`}>
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  )

  if (noProfile) return (
    <main className={`min-h-screen ${bg} ${text}`}>
      <nav className={`flex items-center justify-between px-10 py-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <h1 className="text-xl font-bold text-blue-400">Intern Portal</h1>
        <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">Logout</button>
      </nav>
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-6">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="text-2xl font-bold mb-2">No profile found</h2>
        <p className={`${subtext} max-w-md`}>Your intern profile has not been set up yet. Contact your administrator.</p>
      </div>
    </main>
  )

  return (
    <main className={`min-h-screen ${bg} ${text}`}>
      <nav className={`flex items-center justify-between px-10 py-5 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <h1 className="text-xl font-bold text-blue-400">Intern Portal</h1>
        <div className="flex items-center gap-4">
          {/* Theme toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Theme:</span>
            <button
              onClick={() => updatePref('theme', isDark ? 'light' : 'dark')}
              disabled={savingPref}
              className={`relative w-10 h-5 rounded-full transition-colors ${isDark ? 'bg-gray-700' : 'bg-blue-500'}`}
              title="Toggle theme"
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-transform text-xs flex items-center justify-center ${isDark ? 'translate-x-0.5 bg-gray-300' : 'translate-x-5 bg-white'}`}>
                {isDark ? '🌙' : '☀️'}
              </span>
            </button>
          </div>
          {/* Layout toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => updatePref('layout', 'grid')}
              className={`px-2 py-1 rounded text-xs transition-colors ${prefs.layout === 'grid' ? 'bg-blue-600 text-white' : `${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}`}
              title="Grid view"
            >⊞</button>
            <button
              onClick={() => updatePref('layout', 'list')}
              className={`px-2 py-1 rounded text-xs transition-colors ${prefs.layout === 'list' ? 'bg-blue-600 text-white' : `${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}`}
              title="List view"
            >☰</button>
          </div>
          <span className={`text-sm ${subtext}`}>{user.email}</span>
          <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 transition-colors">Logout</button>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-12">
        {profile && (
          <div className={`${card} border rounded-xl p-6 mb-10 flex items-center gap-6`}>
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {profile.full_name[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{profile.full_name}</h2>
              <p className={`${subtext} text-sm mt-0.5`}>{profile.cohort} Cohort</p>
              {profile.bio && <p className={`${subtext} text-sm mt-2`}>{profile.bio}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                {(profile.skills || []).map((s: string) => (
                  <span key={s} className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full border ${
              profile.approval_status === 'active' ? 'text-green-400 border-green-800' :
              profile.approval_status === 'rejected' ? 'text-red-400 border-red-800' :
              'text-yellow-400 border-yellow-800'
            }`}>{profile.approval_status}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`${card} border rounded-xl p-6 animate-pulse h-24`} />
            ))}
          </div>
        ) : (
          <>
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">
                My Projects <span className={`text-sm font-normal ${subtext}`}>{projects.length} assigned</span>
              </h2>
              {projects.length === 0 ? (
                <div className={`${card} border rounded-xl p-12 text-center`}>
                  <div className="text-4xl mb-3">📁</div>
                  <h3 className="font-semibold mb-1">No projects assigned yet</h3>
                  <p className={`${subtext} text-sm`}>Your administrator will assign projects to you.</p>
                </div>
              ) : prefs.layout === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map(project => (
                    <div key={project.id} className={`${card} border rounded-xl p-6 hover:border-blue-600 transition-colors`}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg">{project.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                          project.status === 'active' ? 'text-green-400 border-green-800' : 'text-gray-400 border-gray-700'
                        }`}>{project.status}</span>
                      </div>
                      {project.description && <p className={`${subtext} text-sm mb-4`}>{project.description}</p>}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(project.tech_stack || []).map(tech => (
                          <span key={tech} className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-full">{tech}</span>
                        ))}
                      </div>
                      <div className="flex gap-4">
                        {project.live_url && <a href={project.live_url} target="_blank" className="text-sm text-blue-400 hover:underline">Live Demo</a>}
                        {project.repo_url && <a href={project.repo_url} target="_blank" className="text-sm text-gray-400 hover:underline">GitHub</a>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map(project => (
                    <div key={project.id} className={`${card} border rounded-xl px-6 py-4 flex items-center justify-between hover:border-blue-600 transition-colors`}>
                      <div>
                        <h3 className="font-semibold">{project.title}</h3>
                        {project.description && <p className={`${subtext} text-sm`}>{project.description}</p>}
                      </div>
                      <div className="flex gap-3">
                        {project.live_url && <a href={project.live_url} target="_blank" className="text-sm text-blue-400 hover:underline">Demo</a>}
                        {project.repo_url && <a href={project.repo_url} target="_blank" className="text-sm text-gray-400 hover:underline">GitHub</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">
                My Tasks <span className={`text-sm font-normal ${subtext}`}>{tasks.length} assigned</span>
              </h2>
              {tasks.length === 0 ? (
                <div className={`${card} border rounded-xl p-12 text-center`}>
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="font-semibold mb-1">No tasks assigned yet</h3>
                  <p className={`${subtext} text-sm`}>Your administrator will assign tasks to you.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className={`${card} border rounded-xl px-6 py-4 flex items-center justify-between hover:border-gray-600 transition-colors`}>
                      <div className="flex items-center gap-4">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          task.status === 'done' ? 'bg-green-400' :
                          task.status === 'in_progress' ? 'bg-yellow-400' : 'bg-gray-500'
                        }`} />
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && <p className={`text-sm ${subtext} mt-0.5`}>{task.description}</p>}
                          {task.due_date && <p className="text-xs text-gray-600 mt-1">Due: {new Date(task.due_date).toLocaleDateString()}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span title={`Priority: ${task.priority}`} className={`text-xs px-2 py-1 rounded-full border cursor-help ${
                          task.priority === 'high' ? 'text-red-400 border-red-800' :
                          task.priority === 'medium' ? 'text-yellow-400 border-yellow-800' :
                          'text-gray-400 border-gray-700'
                        }`}>{task.priority}</span>
                        <select
                          value={task.status}
                          onChange={e => updateTaskStatus(task.id, e.target.value)}
                          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
