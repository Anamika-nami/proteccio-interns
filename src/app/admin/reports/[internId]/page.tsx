'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import { InternReportClient } from './InternReportClient'

interface PageProps {
  params: Promise<{ internId: string }>
}

function ReportContent({ internId }: { internId: string }) {
  const router = useRouter()
  const [report, setReport] = useState<any>(null)
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
  }, [internId])

  async function loadData() {
    try {
      const res = await fetch(`/api/reports/${internId}/export`)
      if (res.ok) {
        const data = await res.json()
        setReport(data.report)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to generate report')
      }
    } catch (e) {
      console.error(e)
      setError('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl h-32 animate-pulse" />
        <div className="bg-gray-900 border border-gray-800 rounded-xl h-96 animate-pulse" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-xl">
        {error || 'Failed to generate report'}
      </div>
    )
  }

  return <InternReportClient report={report} />
}

export default function InternReportPage({ params }: PageProps) {
  const [internId, setInternId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setInternId(p.internId))
  }, [params])

  if (!internId) return null

  return (
    <AppProvider>
      <AppShell role="admin" title="Intern Report" breadcrumbs={[{ label: 'Admin' }, { label: 'Interns', path: '/admin/interns' }, { label: 'Report' }]}>
        <ReportContent internId={internId} />
      </AppShell>
    </AppProvider>
  )
}
