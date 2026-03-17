'use client'
import { useState, useEffect } from 'react'
import { TaskSummary } from './TaskSummary'
import { NotificationCenter } from './NotificationCenter'
import { RecommendationPanel } from './RecommendationPanel'
import { InsightCard } from './InsightCard'
import { useApp } from '@/context/AppContext'
import type { DashboardData } from '@/types'

export function InternDashboard() {
  const { user } = useApp()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    
    // Refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/insights')
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInsightDismiss = async (insightId: string) => {
    try {
      await fetch(`/api/dashboard/insights/${insightId}/dismiss`, {
        method: 'POST'
      })
      
      // Update local state
      setDashboardData(prev => prev ? {
        ...prev,
        insights: prev.insights.filter(i => i.id !== insightId)
      } : null)
    } catch (error) {
      console.error('Failed to dismiss insight:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Failed to load dashboard data</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const { insights, recommendations, stats, todaysTasks, pendingTasks, attendanceStreak } = dashboardData

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
          <p className="text-gray-400">
            Here's what's happening with your internship today
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Today's Tasks</p>
                <p className="text-2xl font-bold text-white">{stats.tasks_today}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Pending Tasks</p>
                <p className="text-2xl font-bold text-white">{stats.pending_tasks}</p>
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
                <p className="text-sm font-medium text-gray-400">Attendance Streak</p>
                <p className="text-2xl font-bold text-white">{stats.attendance_streak} days</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Learning Hours</p>
                <p className="text-2xl font-bold text-white">{stats.learning_hours_week}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tasks and Insights */}
          <div className="lg:col-span-2 space-y-8">
            {/* Insights */}
            {insights.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Insights & Recommendations</h2>
                <div className="space-y-4">
                  {insights.slice(0, 3).map(insight => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onDismiss={handleInsightDismiss}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Today's Tasks */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Today's Tasks</h2>
              <TaskSummary
                tasks={todaysTasks}
                showCollaboration={true}
                onTaskUpdate={loadDashboardData}
              />
            </div>

            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Pending Tasks</h2>
                <TaskSummary
                  tasks={pendingTasks}
                  showCollaboration={true}
                  onTaskUpdate={loadDashboardData}
                />
              </div>
            )}
          </div>

          {/* Right Column - Notifications and Recommendations */}
          <div className="space-y-8">
            {/* Notifications */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Notifications
                {stats.unread_notifications > 0 && (
                  <span className="ml-2 bg-red-600 text-white text-sm px-2 py-1 rounded-full">
                    {stats.unread_notifications}
                  </span>
                )}
              </h2>
              <NotificationCenter />
            </div>

            {/* Recommended Resources */}
            {recommendations.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Recommended for You</h2>
                <RecommendationPanel
                  recommendations={recommendations}
                  onResourceSelect={(resource) => {
                    window.open(`/knowledge/${resource.id}`, '_blank')
                  }}
                />
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/intern/attendance'}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-left transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-medium text-white">Check In/Out</p>
                      <p className="text-sm text-gray-400">Manage your attendance</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => window.location.href = '/intern/worklogs'}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-left transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <div>
                      <p className="font-medium text-white">Log Work</p>
                      <p className="text-sm text-gray-400">Record your daily activities</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => window.location.href = '/knowledge'}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-left transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-purple-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <div>
                      <p className="font-medium text-white">Knowledge Hub</p>
                      <p className="text-sm text-gray-400">Explore learning resources</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => window.location.href = '/mentorship'}
                  className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-4 text-left transition-colors"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <div>
                      <p className="font-medium text-white">Ask Mentor</p>
                      <p className="text-sm text-gray-400">Get help and guidance</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}