'use client'
import { useState, useEffect } from 'react'
import { LearningLogForm } from './LearningLogForm'
import { SkillProgressChart } from './SkillProgressChart'
import { VerificationQueue } from './VerificationQueue'
import { useApp } from '@/context/AppContext'
import type { LearningLog } from '@/types'

export function LearningProgressTracker() {
  const { user } = useApp()
  const [logs, setLogs] = useState<LearningLog[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [showLogForm, setShowLogForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_hours: 0,
    verified_hours: 0,
    pending_logs: 0,
    categories_learned: 0
  })

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    loadLearningLogs()
    loadStats()
  }, [selectedCategory, selectedStatus])

  const loadLearningLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedStatus !== 'all' && { verification_status: selectedStatus })
      })

      const response = await fetch(`/api/learning/logs?${params}`)
      const data = await response.json()
      setLogs(data.logs || [])
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to load learning logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/learning/stats')
      const data = await response.json()
      setStats(data.stats || stats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleNewLog = async (data: {
    topic: string
    description: string
    category: string
    tools_used: string[]
    time_spent_hours: number
    evidence_url?: string
  }) => {
    try {
      const response = await fetch('/api/learning/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setShowLogForm(false)
        loadLearningLogs()
        loadStats()
      }
    } catch (error) {
      console.error('Failed to create learning log:', error)
    }
  }

  const handleVerification = async (logId: string, status: 'verified' | 'rejected', notes?: string) => {
    try {
      const response = await fetch(`/api/learning/logs/${logId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_status: status,
          verification_notes: notes
        })
      })

      if (response.ok) {
        loadLearningLogs()
        loadStats()
      }
    } catch (error) {
      console.error('Failed to verify learning log:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-400 bg-green-900 border-green-700'
      case 'rejected': return 'text-red-400 bg-red-900 border-red-700'
      case 'pending': return 'text-yellow-400 bg-yellow-900 border-yellow-700'
      default: return 'text-gray-400 bg-gray-900 border-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Learning Progress</h1>
              <p className="text-gray-400">
                {isAdmin 
                  ? 'Review and verify intern learning activities'
                  : 'Track your learning journey and skill development'
                }
              </p>
            </div>
            
            {!isAdmin && (
              <button
                onClick={() => setShowLogForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Log Learning
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Hours</p>
                <p className="text-2xl font-bold text-white">{stats.total_hours}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Verified Hours</p>
                <p className="text-2xl font-bold text-white">{stats.verified_hours}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.pending_logs}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Categories</p>
                <p className="text-2xl font-bold text-white">{stats.categories_learned}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Progress Chart */}
        {!isAdmin && (
          <div className="mb-8">
            <SkillProgressChart logs={logs} />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-4">
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

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {showLogForm ? (
          <LearningLogForm
            onSubmit={handleNewLog}
            onCancel={() => setShowLogForm(false)}
          />
        ) : isAdmin ? (
          <VerificationQueue
            logs={logs}
            loading={loading}
            onVerify={handleVerification}
          />
        ) : (
          /* Learning Logs List */
          <div className="bg-gray-900 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold">Your Learning Logs</h2>
            </div>
            
            <div className="divide-y divide-gray-700">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400">No learning logs found</p>
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-white">{log.topic}</h3>
                          <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(log.verification_status)}`}>
                            {log.verification_status}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 mb-3">{log.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                          <span>Category: {log.category}</span>
                          <span>Time: {log.time_spent_hours}h</span>
                          <span>Date: {formatDate(log.created_at)}</span>
                        </div>
                        
                        {log.tools_used && log.tools_used.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {log.tools_used.map(tool => (
                              <span key={tool} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                                {tool}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {log.verification_notes && (
                          <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
                            <p className="text-sm text-gray-300">
                              <span className="font-medium">Admin notes:</span> {log.verification_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {log.evidence_url && (
                        <a
                          href={log.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View Evidence →
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}