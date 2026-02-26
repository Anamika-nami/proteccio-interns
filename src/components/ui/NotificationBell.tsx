'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  type: string
  message: string
  is_read: boolean
  link: string | null
  created_at: string
}

const typeIcons: Record<string, string> = {
  profile_incomplete: '👤',
  consent_required: '🔒',
  pending_approval: '⏳',
  task_overdue: '⚠️',
  project_assigned: '📁',
  default: '🔔'
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch {}
  }

  async function markRead(id: string, link?: string | null) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    if (link) { setOpen(false); router.push(link) }
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true })
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
        title="Notifications"
      >
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No notifications</div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id, n.link)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0 ${!n.is_read ? 'bg-gray-800/50' : ''}`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {typeIcons[n.type] || typeIcons.default}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.is_read ? 'text-white font-medium' : 'text-gray-300'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
