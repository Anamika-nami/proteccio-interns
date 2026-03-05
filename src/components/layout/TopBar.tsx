'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { createClient } from '@/lib/supabase/client'

type Crumb = { label: string; href?: string }

type Props = {
  title?: string
  breadcrumbs?: Crumb[]
}

export default function TopBar({ title, breadcrumbs }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { setSidebarOpen } = useApp()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let count = 0

    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return

      // Fetch unread notifications
      supabase.from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', data.user.id)
        .eq('is_read', false)
        .then(({ count: notifCount }) => {
          count += notifCount || 0
          setUnread(count)
        })

      // Fetch smart alerts (warnings + criticals)
      fetch('/api/alerts')
        .then(r => r.json())
        .then(alerts => {
          if (Array.isArray(alerts)) {
            const serious = alerts.filter((a: any) =>
              a.severity === 'critical' || a.severity === 'warning'
            ).length
            setUnread(prev => prev + serious)
          }
        })
        .catch(() => {})
    })
  }, [pathname])

  const crumbs = breadcrumbs || [{ label: title || '' }]

  return (
    <header className="sticky top-0 z-20 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-4 md:px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
          aria-label="Open navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-600">/</span>}
              {crumb.href ? (
                <button
                  onClick={() => router.push(crumb.href!)}
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={i === crumbs.length - 1 ? 'text-white font-medium' : 'text-gray-400'}>
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* Alerts bell */}
        <button
          onClick={() => router.push('/admin/logs')}
          className="relative text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-2 transition-colors"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Settings shortcut */}
        <button
          onClick={() => router.push('/admin/settings')}
          className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-2 transition-colors"
          aria-label="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  )
}
