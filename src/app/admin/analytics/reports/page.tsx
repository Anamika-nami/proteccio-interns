'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import { ReportsManager } from '@/components/analytics/ReportsManager'

function ReportsContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error || !data.user) {
        router.push('/admin/login')
        return
      }
      setLoading(false)
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        router.push('/admin/login')
      }
    })

    return () => { mounted = false }
  }, [router])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-800 rounded w-64 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-800 rounded w-96 animate-pulse"></div>
          </div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="h-6 bg-gray-800 rounded w-48 animate-pulse mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg h-16 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return <ReportsManager />
}

export default function ReportsPage() {
  return (
    <AppProvider>
      <AppShell 
        role="admin" 
        title="Analytics Reports" 
        breadcrumbs={[
          { label: 'Admin' }, 
          { label: 'Analytics', path: '/admin/analytics' },
          { label: 'Reports' }
        ]}
      >
        <ReportsContent />
      </AppShell>
    </AppProvider>
  )
}