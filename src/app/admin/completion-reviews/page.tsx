'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import { CompletionReviewClient } from './CompletionReviewClient'

function CompletionReviewsContent() {
  const router = useRouter()
  const [interns, setInterns] = useState<any[]>([])
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
      const res = await fetch('/api/completion?status=completion_review')
      if (res.ok) {
        const data = await res.json()
        setInterns(data.interns || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl h-32 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-200">Completion Reviews</h2>
        <p className="text-gray-400 mt-1">
          Review and approve internship completions
        </p>
      </div>

      <CompletionReviewClient interns={interns} />
    </div>
  )
}

export default function CompletionReviewsPage() {
  return (
    <AppProvider>
      <AppShell role="admin" title="Completion Reviews" breadcrumbs={[{ label: 'Admin' }, { label: 'Completion Reviews' }]}>
        <CompletionReviewsContent />
      </AppShell>
    </AppProvider>
  )
}
