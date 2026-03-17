'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Config = {
  app_name: string
  primary_color: string
  secondary_color: string
  feature_interns: string
  feature_projects: string
  feature_tasks: string
  dashboard_layout: string
}

const defaultConfig: Config = {
  app_name: 'Proteccio Interns',
  primary_color: '#2563EB',
  secondary_color: '#1E3A5F',
  feature_interns: 'true',
  feature_projects: 'true',
  feature_tasks: 'true',
  dashboard_layout: 'grid',
}

const ConfigContext = createContext<Config>(defaultConfig)

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config>(defaultConfig)

  useEffect(() => {
    // Temporary fix: Add error handling to prevent infinite loops
    let mounted = true
    fetch('/api/config')
      .then(r => {
        if (!r.ok) {
          console.warn('Config API failed, using defaults')
          return {}
        }
        return r.json()
      })
      .then(data => {
        if (mounted) {
          setConfig({ ...defaultConfig, ...data })
        }
      })
      .catch((error) => {
        console.warn('Config fetch failed, using defaults:', error)
        if (mounted) {
          setConfig(defaultConfig)
        }
      })
    
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', config.primary_color)
    document.documentElement.style.setProperty('--color-secondary', config.secondary_color)
    document.title = config.app_name
  }, [config])

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  return useContext(ConfigContext)
}
