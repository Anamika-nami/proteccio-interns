'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/admin/login')
      else setUser(data.user)
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (!user) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <h1 className="text-xl font-bold text-blue-400">Admin Dashboard</h1>
        <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">
          Logout
        </button>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <p className="text-gray-400 mb-10">Logged in as <span className="text-white">{user.email}</span></p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Interns', value: '0' },
            { label: 'Total Projects', value: '0' },
            { label: 'Unread Messages', value: '0' },
          ].map(card => (
            <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">{card.label}</p>
              <p className="text-4xl font-bold text-blue-400">{card.value}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
