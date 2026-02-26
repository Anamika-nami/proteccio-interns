'use client'
import { useEffect, useState } from 'react'

type Project = {
  id: string
  title: string
  description: string | null
  tech_stack: string[]
  status: string
  live_url: string | null
  repo_url: string | null
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [disabled, setDisabled] = useState(false)

  useEffect(() => {
    fetch('/api/projects')
      .then(async res => {
        if (res.status === 403) { setDisabled(true); setLoading(false); return }
        const data = await res.json()
        setProjects(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (disabled) return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-2">Module Disabled</h2>
        <p className="text-gray-400">The Projects module has been disabled by the administrator.</p>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h2 className="text-4xl font-bold mb-2">Projects</h2>
          <p className="text-gray-400">
            {loading ? 'Loading...' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-700 rounded w-full mb-2" />
                <div className="h-3 bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 border border-gray-800 rounded-xl">
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-xl font-bold mb-2">No projects yet</h3>
            <p className="text-gray-500">Projects will appear here once added by the administrator.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map(project => (
              <div key={project.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-3 hover:border-blue-600 transition-colors">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg">{project.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ml-2 ${
                    project.status === 'active' ? 'text-green-400 border-green-800' : 'text-gray-400 border-gray-700'
                  }`}>{project.status}</span>
                </div>
                {project.description && <p className="text-gray-400 text-sm">{project.description}</p>}
                <div className="flex flex-wrap gap-2 mt-auto">
                  {(project.tech_stack || []).map(tech => (
                    <span key={tech} className="bg-gray-800 text-blue-400 text-xs px-2 py-1 rounded-full">{tech}</span>
                  ))}
                </div>
                <div className="flex gap-4 pt-2 border-t border-gray-800">
                  {project.live_url
                    ? <a href={project.live_url} target="_blank" className="text-sm text-blue-400 hover:underline">Live Demo</a>
                    : <span className="text-sm text-gray-600">No demo</span>
                  }
                  {project.repo_url && <a href={project.repo_url} target="_blank" className="text-sm text-gray-400 hover:underline">GitHub</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
