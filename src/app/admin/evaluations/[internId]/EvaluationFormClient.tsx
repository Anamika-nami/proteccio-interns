'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EvaluationForm } from '@/components/evaluations/EvaluationForm'
import type { CreateEvaluationDTO } from '@/types'
import toast from 'react-hot-toast'

interface EvaluationFormClientProps {
  internId: string
  internName: string
}

export function EvaluationFormClient({ internId, internName }: EvaluationFormClientProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async (data: CreateEvaluationDTO) => {
    const response = await fetch('/api/evaluations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to submit evaluation')
    }

    toast.success('Evaluation submitted successfully')
    setShowForm(false)
    router.refresh()
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Add New Evaluation
      </button>
    )
  }

  return (
    <EvaluationForm
      internId={internId}
      internName={internName}
      onSubmit={handleSubmit}
      onCancel={() => setShowForm(false)}
    />
  )
}
