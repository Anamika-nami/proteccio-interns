'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  data?: Record<string, any>
}

export function NotificationCenter() {
  const { user } = useApp()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications?limit=10')
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'collaboration_mention':
        return (
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        )
      case 'mentorship_request':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )
      case 'mentorship_message':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4v-4z" />
          </svg>
        )
      case 'learning_verification':
        return (
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0v5" />
          </svg>
        )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.data) {
      switch (notification.type) {
        case 'collaboration_mention':
          if (notification.data.thread_id) {
            window.location.href = `/tasks?thread=${notification.data.thread_id}`
          }
          break
        case 'mentorship_request':
        case 'mentorship_message':
          if (notification.data.conversation_id) {
            window.location.href = `/mentorship?conversation=${notification.data.conversation_id}`
          }
          break
        case 'learning_verification':
          window.location.href = '/learning'
          break
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 text-center">
        <svg className="w-8 h-8 text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0v5" />
        </svg>
        <p className="text-gray-400 text-sm">No notifications</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-white">Recent Notifications</h3>
          <button
            onClick={loadNotifications}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-700">
        {notifications.map(notification => (
          <button
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`w-full text-left p-4 hover:bg-gray-800 transition-colors ${
              !notification.is_read ? 'bg-blue-900/20' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-white truncate">
                    {notification.title}
                  </h4>
                  {!notification.is_read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                  )}
                </div>
                
                <p className="text-sm text-gray-400 line-clamp-2">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {formatDate(notification.created_at)}
                  </span>
                  
                  <span className="text-xs text-gray-500 capitalize">
                    {notification.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => window.location.href = '/notifications'}
          className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
        >
          View All Notifications
        </button>
      </div>
    </div>
  )
}