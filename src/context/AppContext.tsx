'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type User = { id: string; email: string; role: 'admin' | 'intern' | 'public' } | null
type Config = Record<string, string>
type AppState = {
  user: User; config: Config; loading: boolean; sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void; refreshConfig: () => Promise<void>; signOut: () => Promise<void>
}

const AppContext = createContext<AppState>({
  user: null, config: {}, loading: true, sidebarOpen: false,
  setSidebarOpen: () => {}, refreshConfig: async () => {}, signOut: async () => {}
})

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [config, setConfig] = useState<Config>({})
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const refreshConfig = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('app_config').select('key, value')
      
      if (error) {
        console.warn('Config refresh failed, using defaults:', error)
        return
      }
      
      const cfg: Config = {}
      ;(data || []).forEach((r: any) => { cfg[r.key] = r.value })
      setConfig(cfg)
    } catch (error) {
      console.warn('Config refresh error:', error)
    }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).single()
        setUser({ id: data.user.id, email: data.user.email || '', role: (profile as any)?.role || 'intern' })
      }
      await refreshConfig()
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') setUser(null)
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase.from('users').select('role').eq('id', session.user.id).single()
        setUser({ id: session.user.id, email: session.user.email || '', role: (profile as any)?.role || 'intern' })
      }
    })
    return () => subscription.unsubscribe()
  }, [refreshConfig])

  return (
    <AppContext.Provider value={{ user, config, loading, sidebarOpen, setSidebarOpen, refreshConfig, signOut }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
