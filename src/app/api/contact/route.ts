'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

type FormState = {
  name: string
  email: string
  subject: string
  body: string
}

type Errors = Partial<Record<keyof FormState, string>>

function validate(form: FormState): Errors {
  const errors: Errors = {}
  if (!form.name.trim()) errors.name = 'Name is required'
  if (!form.email.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address'
  if (!form.subject.trim()) errors.subject = 'Subject is required'
  if (!form.body.trim()) errors.body = 'Message is required'
  else if (form.body.trim().length < 10) errors.body = 'Message must be at least 10 characters'
  return errors
}

export default function Contact() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', body: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const MAX_BODY = 1000

  function handleBlur(field: keyof FormState) {
    setTouched(prev => ({ ...prev, [field]: true }))
    const errs = validate({ ...form })
    setErrors(errs)
  }

  function handleChange(field: keyof FormState, value: string) {
    const updated = { ...form, [field]: value }
    setForm(updated)
    if (touched[field]) {
      setErrors(validate(updated))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const allTouched = { name: true, email: true, subject: true, body: true }
    setTouched(allTouched)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setSubmitted(true)
        toast.success('Message sent!')
      } else {
        toast.error('Failed to send. Please try again.')
      }
    } catch {
      toast.error('Something went wrong.')
    }
    setSubmitting(false)
  }

  function fieldClass(field: keyof FormState) {
    const base = 'w-full bg-gray-800 border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors'
    if (touched[field] && errors[field]) return `${base} border-red-500 focus:border-red-400`
    if (touched[field] && !errors[field]) return `${base} border-green-600 focus:border-green-500`
    return `${base} border-gray-700 focus:border-blue-500`
  }

  if (submitted) return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-3xl font-bold mb-3">Message Sent!</h2>
        <p className="text-gray-400 mb-8">We'll get back to you as soon as possible.</p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', body: '' }); setTouched({}); setErrors({}) }}
          className="text-blue-400 hover:underline text-sm"
        >
          Send another message
        </button>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <section className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3">Get in Touch</h1>
          <p className="text-gray-400">Have questions about the programme? We'd love to hear from you.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Full Name *</label>
              <input
                type="text"
                placeholder="Your name"
                className={fieldClass('name')}
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
              />
              {touched.name && errors.name && (
                <p className="text-red-400 text-xs mt-1.5">{errors.name}</p>
              )}
              {touched.name && !errors.name && (
                <p className="text-green-500 text-xs mt-1.5">✓ Looks good</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Email Address *</label>
              <input
                type="email"
                placeholder="your@email.com"
                className={fieldClass('email')}
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
              />
              {touched.email && errors.email && (
                <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>
              )}
              {touched.email && !errors.email && (
                <p className="text-green-500 text-xs mt-1.5">✓ Looks good</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Subject *</label>
            <input
              type="text"
              placeholder="What's this about?"
              className={fieldClass('subject')}
              value={form.subject}
              onChange={e => handleChange('subject', e.target.value)}
              onBlur={() => handleBlur('subject')}
            />
            {touched.subject && errors.subject && (
              <p className="text-red-400 text-xs mt-1.5">{errors.subject}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-gray-400">Message *</label>
              <span className={`text-xs ${form.body.length > MAX_BODY * 0.9 ? 'text-yellow-400' : 'text-gray-600'}`}>
                {form.body.length} / {MAX_BODY}
              </span>
            </div>
            <textarea
              rows={6}
              maxLength={MAX_BODY}
              placeholder="Tell us more..."
              className={fieldClass('body')}
              value={form.body}
              onChange={e => handleChange('body', e.target.value)}
              onBlur={() => handleBlur('body')}
            />
            {touched.body && errors.body && (
              <p className="text-red-400 text-xs mt-1.5">{errors.body}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Sending...
              </span>
            ) : 'Send Message'}
          </button>

        </form>
      </section>
    </main>
  )
}
