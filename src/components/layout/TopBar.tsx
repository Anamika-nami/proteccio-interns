'use client'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TopBar({ title, breadcrumbs = [] }: {
  title: string
  breadcrumbs?: { label: string; path?: string }[]
}) {
  const { setSidebarOpen, user } = useApp()
  const router = useRouter()
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase.from('notifications').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('is_read', false)
      .then(({ count }) => setNotifCount(count || 0))
  }, [user])

  return (
    <header className="h-14 bg-gray-900/80 backdrop-blur border-b border-gray-800 flex items-center justify-between px-4 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"
          className="lg:hidden text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.length > 0 ? breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-600">/</span>}
              {crumb.path ? (
                <button onClick={() => router.push(crumb.path!)} className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
                  {crumb.label}
                </button>
              ) : (
                <span className="text-gray-200 font-medium">{crumb.label}</span>
              )}
            </span>
          )) : <span className="text-gray-200 font-medium">{title}</span>}
        </nav>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => router.push('/admin/logs')} aria-label={`${notifCount} notifications`}
          className="relative text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-2 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {notifCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
        </button>
        <button onClick={() => router.push('/admin/settings')} aria-label="Settings"
          className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-2 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  )
}
