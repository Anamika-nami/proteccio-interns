'use client'
import { useState, useEffect } from 'react'
import { ResourceGrid } from './ResourceGrid'
import { ResourceViewer } from './ResourceViewer'
import { useApp } from '@/context/AppContext'
import type { KnowledgeResource } from '@/types'

export function KnowledgeHubPage() {
  const { user } = useApp()
  const [resources, setResources] = useState<KnowledgeResource[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedResource, setSelectedResource] = useState<KnowledgeResource | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    loadResources(true)
  }, [selectedCategory, selectedDifficulty, searchQuery])

  const loadResources = async (reset = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: reset ? '1' : page.toString(),
        limit: '12',
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedDifficulty !== 'all' && { difficulty: selectedDifficulty }),
        ...(searchQuery && { search: searchQuery })
      })

      const response = await fetch(`/api/knowledge/resources?${params}`)
      const data = await response.json()

      if (reset) {
        setResources(data.resources || [])
        setCategories(data.categories || [])
        setPage(1)
      } else {
        setResources(prev => [...prev, ...(data.resources || [])])
      }

      setHasMore(data.resources?.length === 12)
    } catch (error) {
      console.error('Failed to load resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    setPage(prev => prev + 1)
    loadResources(false)
  }

  const handleResourceSelect = (resource: KnowledgeResource) => {
    setSelectedResource(resource)
  }

  const handleBookmark = async (resourceId: string) => {
    try {
      const response = await fetch('/api/knowledge/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_id: resourceId })
      })

      if (response.ok) {
        // Update local state
        setResources(prev => prev.map(r => 
          r.id === resourceId ? { ...r, is_bookmarked: true } : r
        ))
      }
    } catch (error) {
      console.error('Failed to bookmark resource:', error)
    }
  }

  const handleProgressUpdate = async (resourceId: string, progress: any) => {
    try {
      const response = await fetch(`/api/knowledge/progress/${resourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progress)
      })

      if (response.ok) {
        // Update local state
        setResources(prev => prev.map(r => 
          r.id === resourceId ? { ...r, user_progress: progress } : r
        ))
      }
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Knowledge Hub</h1>
          <p className="text-gray-400">
            Discover learning resources, tutorials, and documentation to accelerate your growth
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search resources..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {selectedResource ? (
          <ResourceViewer
            resource={selectedResource}
            onClose={() => setSelectedResource(null)}
            onProgressUpdate={handleProgressUpdate}
          />
        ) : (
          <ResourceGrid
            resources={resources}
            loading={loading}
            hasMore={hasMore}
            onResourceSelect={handleResourceSelect}
            onBookmark={handleBookmark}
            onLoadMore={handleLoadMore}
          />
        )}
      </div>
    </div>
  )
}