import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth(requireAuth = true, redirectTo = '/admin/login') {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function checkAuth() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.getUser()

        if (!mounted) return

        if (error) throw error

        if (!data.user && requireAuth) {
          router.push(redirectTo)
          return
        }

        setUser(data.user)
      } catch (err) {
        console.error('Auth check failed:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        if (requireAuth) {
          router.push(redirectTo)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    // Set up auth state listener
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT' && requireAuth) {
        router.push(redirectTo)
      } else if (event === 'SIGNED_IN') {
        setUser(session?.user ?? null)
      } else if (event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [requireAuth, redirectTo, router])

  return { user, loading, error }
}
