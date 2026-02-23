'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', body: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name || form.name.length < 2) e.name = 'Name must be at least 2 characters'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.subject || form.subject.length < 5) e.subject = 'Subject must be at least 5 characters'
    if (!form.body || form.body.length < 20) e.body = 'Message must be at least 20 characters'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Message sent successfully!')
        setForm({ name: '', email: '', subject: '', body: '' })
        setErrors({})
      } else {
        toast.error('Failed to send message. Please try again.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <section className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold mb-2">Contact Us</h2>
        <p className="text-gray-400 mb-10">Have a question? Send us a message.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <input type="text" placeholder="Your Name"
              className={`w-full bg-gray-900 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-700'}`}
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              onBlur={() => setErrors(prev => ({ ...prev, name: form.name.length < 2 ? 'Name must be at least 2 characters' : '' }))}
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <input type="email" placeholder="Your Email"
              className={`w-full bg-gray-900 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-700'}`}
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              onBlur={() => setErrors(prev => ({ ...prev, email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'Enter a valid email' : '' }))}
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <input type="text" placeholder="Subject"
              className={`w-full bg-gray-900 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 ${errors.subject ? 'border-red-500' : 'border-gray-700'}`}
              value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
              onBlur={() => setErrors(prev => ({ ...prev, subject: form.subject.length < 5 ? 'Subject must be at least 5 characters' : '' }))}
            />
            {errors.subject && <p className="text-red-400 text-sm mt-1">{errors.subject}</p>}
          </div>
          <div>
            <textarea placeholder="Your message..." rows={5}
              className={`w-full bg-gray-900 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 ${errors.body ? 'border-red-500' : 'border-gray-700'}`}
              value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
              onBlur={() => setErrors(prev => ({ ...prev, body: form.body.length < 20 ? 'Message must be at least 20 characters' : '' }))}
            />
            {errors.body && <p className="text-red-400 text-sm mt-1">{errors.body}</p>}
          </div>
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium transition-colors">
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </section>
    </main>
  )
}