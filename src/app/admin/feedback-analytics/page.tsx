'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import { FeedbackAnalyticsClient } from './FeedbackAnalyticsClient'

function FeedbackAnalyticsContent() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error || !data.user) {
        router.push('/admin/login')
        return
      }
      loadData()
    }).catch(() => {
      if (mounted) {
        setLoading(false)
        router.push('/admin/login')
      }
    })

    return () => { mounted = false }
  }, [])

  async function loadData() {
    try {
      const res = await fetch('/api/feedback?analytics=true')
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data.analytics)
      } else {
        setError('Failed to load analytics')
      }
    } catch (e) {
      console.error(e)
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-48 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-xl">
        {error || 'Failed to load analytics'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-200">Feedback Analytics</h2>
        <p className="text-gray-400 mt-1">
          Insights from intern program feedback
        </p>
      </div>

      <FeedbackAnalyticsClient analytics={analytics} />
    </div>
  )
}

export default function FeedbackAnalyticsPage() {
  return (
    <AppProvider>
      <AppShell role="admin" title="Feedback Analytics" breadcrumbs={[{ label: 'Admin' }, { label: 'Feedback Analytics' }]}>
        <FeedbackAnalyticsContent />
      </AppShell>
    </AppProvider>
  )
}
