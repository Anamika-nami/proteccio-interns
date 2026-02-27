'use client'
import { useEffect, useState } from 'react'

export default function ConsentBanner() {
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/consent')
      .then(r => r.json())
      .then(data => { if (!data.consented) setShow(true) })
      .catch(() => {})
  }, [])

  async function handleAgree() {
    setSaving(true)
    const res = await fetch('/api/consent', { method: 'POST' })
    if (res.ok) setShow(false)
    setSaving(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative bg-gray-900 border border-blue-800 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        <div className="text-4xl mb-4 text-center">🔒</div>
        <h2 className="text-2xl font-bold text-white text-center mb-2">Privacy Notice</h2>
        <p className="text-gray-400 text-sm text-center mb-6">
          Before you continue, please review and accept our data practices.
        </p>
        <div className="bg-gray-800 rounded-xl p-4 mb-6 text-sm text-gray-300 space-y-2">
          <p>✦ We collect your name, email, and profile information to operate the intern portal.</p>
          <p>✦ Your data is never sold to third parties.</p>
          <p>✦ You can request deletion of your data at any time by contacting your administrator.</p>
          <p>✦ Activity logs record your actions for security and audit purposes.</p>
          <p>✦ This consent is recorded with a timestamp and policy version.</p>
        </div>
        <button
          onClick={handleAgree}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {saving ? 'Recording consent...' : 'I understand and agree'}
        </button>
        <p className="text-xs text-gray-600 text-center mt-3">
          Consent version v1 · {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
