'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Project = {
  id: string
  title: string
  description: string
  tech_stack: string[]
  status: string
  live_url: string
  repo_url: string
}

type Task = {
  id: string
  title: string
  description: string
  status: string
  priority: string
  due_date: string
}

export default function InternPortal() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else { setUser(data.user); fetchData(data.user.id) }
    })
  }, [])

  async function fetchData(userId: string) {
    const supabase = createClient()

    // Get intern profile
    const { data: profile } = await supabase
      .from('intern_profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!profile) { setLoading(false); return }

    // Get assigned projects
    const { data: projectLinks } = await supabase
      .from('project_interns')
      .select('project_id')
      .eq('intern_id', profile.id)

    if (projectLinks && projectLinks.length > 0) {
      const projectIds = projectLinks.map(p => p.project_id)
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
      setProjects(projectData || [])
    }

    // Get assigned tasks
    const { data: taskData } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', profile.id)
      .order('created_at', { ascending: false })
    setTasks(taskData || [])

    setLoading(false)
  }

  async function updateTaskStatus(taskId: string, newStatus: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)

    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (!user) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <h1 className="text-xl font-bold text-blue-400">Intern Portal</h1>
        <div className="flex items-center gap-6">
          <span className="text-sm text-gray-400">{user.email}</span>
          <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-12">

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <>
            {/* Assigned Projects */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6">My Projects</h2>
              {projects.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
                  No projects assigned yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {projects.map(project => (
                    <div key={project.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg">{project.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                          project.status === 'active' ? 'text-green-400 border-green-800' : 'text-gray-400 border-gray-700'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-gray-400 text-sm mb-4">{project.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(project.tech_stack || []).map(tech => (
                          <span key={tech} className="bg-gray-800 text-blue-400 text-xs px-2 py-1 rounded-full">{tech}</span>
                        ))}
                      </div>
                      <div className="flex gap-4">
                        {project.live_url && (
                          <a href={project.live_url} target="_blank" className="text-sm text-blue-400 hover:underline">Live Demo</a>
                        )}
                        {project.repo_url && (
                          <a href={project.repo_url} target="_blank" className="text-sm text-gray-400 hover:underline">GitHub</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Tasks */}
            <div>
              <h2 className="text-2xl font-bold mb-6">My Tasks</h2>
              {tasks.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">
                  No tasks assigned yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 flex items-center justify-between hover:border-gray-600 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className={`w-2 h-2 rounded-full ${
                          task.status === 'done' ? 'bg-green-400' :
                          task.status === 'in_progress' ? 'bg-yellow-400' :
                          'bg-gray-500'
                        }`} />
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full border ${
                          task.priority === 'high' ? 'text-red-400 border-red-800' :
                          task.priority === 'medium' ? 'text-yellow-400 border-yellow-800' :
                          'text-gray-400 border-gray-700'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
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
