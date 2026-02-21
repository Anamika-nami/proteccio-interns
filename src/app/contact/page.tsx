'use client'
import Link from 'next/link'
import { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', body: '' })
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) setSent(true)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <h1 className="text-xl font-bold text-blue-400">Proteccio Interns</h1>
        <div className="flex gap-6 text-sm text-gray-300">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/interns" className="hover:text-white">Interns</Link>
          <Link href="/projects" className="hover:text-white">Projects</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
          <Link href="/admin/login" className="hover:text-white text-blue-400">Admin</Link>
        </div>
      </nav>

      <section className="max-w-2xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-bold mb-4">Contact Us</h2>
        <p className="text-gray-400 mb-10">Have a question? Send us a message.</p>

        {sent ? (
          <div className="bg-green-900 border border-green-700 rounded-xl p-6 text-green-300">
            Message sent successfully! We'll get back to you soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <input
              type="text" placeholder="Your Name" required
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              type="email" placeholder="Your Email" required
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="text" placeholder="Subject" required
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
            />
            <textarea
              placeholder="Your message..." required rows={5}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium">
              Send Message
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
