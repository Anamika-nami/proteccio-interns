'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppProvider } from '@/context/AppContext'
import AppShell from '@/components/layout/AppShell'
import { EvaluationHistory } from '@/components/evaluations/EvaluationHistory'
import { EvaluationFormClient } from './EvaluationFormClient'

interface PageProps {
  params: Promise<{ internId: string }>
}

function EvaluationContent({ internId }: { internId: string }) {
  const router = useRouter()
  const [intern, setIntern] = useState<any>(null)
  const [evaluations, setEvaluations] = useState<any[]>([])
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
      const supabase = createClient()

      // Fetch intern details
      const { data: internData, error: internError } = await supabase
        .from('intern_profiles')
        .select('id, full_name, cohort, lifecycle_status')
        .eq('id', internId)
        .single()

      if (internError || !internData) {
        setError('Intern not found')
        setLoading(false)
        return
      }

      setIntern(internData)

      // Fetch existing evaluations
      const res = await fetch(`/api/evaluations?internId=${internId}`)
      if (res.ok) {
        const data = await res.json()
        setEvaluations(data.evaluations || [])
      }
    } catch (e) {
      console.error(e)
      setError('Failed to load data')
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

  if (error || !intern) {
    return (
      <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded-xl">
        {error || 'Intern not found'}
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-200">Intern Evaluation</h2>
        <p className="text-gray-400 mt-1">
          {intern.full_name} - Cohort {intern.cohort}
        </p>
      </div>

      <EvaluationFormClient
        internId={intern.id}
        internName={intern.full_name}
      />

      {evaluations.length > 0 && (
        <EvaluationHistory evaluations={evaluations} />
      )}
    </div>
  )
}

export default function InternEvaluationPage({ params }: PageProps) {
  const [internId, setInternId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setInternId(p.internId))
  }, [params])

  if (!internId) return null

  return (
    <AppProvider>
      <AppShell role="admin" title="Evaluation" breadcrumbs={[{ label: 'Admin' }, { label: 'Interns', path: '/admin/interns' }, { label: 'Evaluation' }]}>
        <EvaluationContent internId={internId} />
      </AppShell>
    </AppProvider>
  )
}
