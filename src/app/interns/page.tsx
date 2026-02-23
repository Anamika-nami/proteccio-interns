'use client'
import { useState, useEffect, useCallback } from 'react'

type Intern = {
  id: string
  full_name: string
  bio: string
  skills: string[]
  cohort: string
  avatar_url: string
  linkedin_url: string
}

export default function Interns() {
  const [interns, setInterns] = useState<Intern[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('active')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchInterns = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ search, status, page: String(page), limit: '9' })
    const res = await fetch(`/api/interns?${params}`)
    const json = await res.json()
    setInterns(json.data || [])
    setTotalPages(json.totalPages || 1)
    setTotal(json.total || 0)
    setLoading(false)
  }, [search, status, page])

  useEffect(() => {
    const timer = setTimeout(fetchInterns, 300)
    return () => clearTimeout(timer)
  }, [fetchInterns])

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold">Our Interns</h2>
            <p className="text-gray-400 mt-1">{total} intern{total !== 1 ? 's' : ''} found</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <input
            type="text"
            placeholder="Search by name or bio..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1) }}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-gray-700 mb-4" />
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : interns.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 text-lg">No interns found.</p>
            {search && <button onClick={() => setSearch('')} className="mt-4 text-blue-400 hover:underline">Clear search</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {interns.map(intern => (
              <div key={intern.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-3 hover:border-blue-600 transition-colors">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
                  {intern.full_name[0]}
                </div>
                <h3 className="text-lg font-semibold">{intern.full_name}</h3>
                <p className="text-gray-400 text-sm">{intern.cohort}</p>
                {intern.bio && <p className="text-gray-500 text-sm line-clamp-2">{intern.bio}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {(intern.skills || []).slice(0, 3).map(skill => (
                    <span key={skill} className="bg-gray-800 text-blue-400 text-xs px-2 py-1 rounded-full">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">
              Previous
            </button>
            <span className="text-gray-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700">
              Next
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
