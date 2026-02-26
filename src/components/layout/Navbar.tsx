'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useConfig } from '@/context/ConfigContext'
import NotificationBell from '@/components/ui/NotificationBell'

export default function Navbar() {
  const config = useConfig()
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        setUser(data.user)
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()
        setRole(profile?.role || null)
      }
    })
  }, [])

  return (
    <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800 bg-gray-950">
      <Link href="/" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
        {config.app_name}
      </Link>
      <div className="flex items-center gap-6">
        {config.feature_interns === 'true' && (
          <Link href="/interns" className="text-sm text-gray-400 hover:text-white transition-colors">Interns</Link>
        )}
        {config.feature_projects === 'true' && (
          <Link href="/projects" className="text-sm text-gray-400 hover:text-white transition-colors">Projects</Link>
        )}
        <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</Link>
        {user && <NotificationBell />}
        {role === 'admin' && (
          <Link href="/admin/dashboard" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Dashboard</Link>
        )}
        {role === 'intern' && (
          <Link href="/intern" className="text-sm text-green-400 hover:text-green-300 transition-colors">My Portal</Link>
        )}
      </div>
    </nav>
  )
}
