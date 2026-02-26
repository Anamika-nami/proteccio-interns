import { createClient } from '@/lib/supabase/server'

type ConfigMap = Record<string, string>

let cache: ConfigMap | null = null
let lastFetched = 0
const TTL = 60 * 1000 // 60 seconds

export async function getConfig(): Promise<ConfigMap> {
  const now = Date.now()
  if (cache && now - lastFetched < TTL) return cache

  try {
    const supabase = await createClient()
    const { data } = await supabase.from('app_config').select('key, value')
    const map: ConfigMap = {}
    ;(data || []).forEach(row => { map[row.key] = row.value })
    cache = map
    lastFetched = now
    return map
  } catch {
    return cache || {}
  }
}

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const config = await getConfig()
  return config[key] === 'true'
}

export function invalidateCache() {
  cache = null
  lastFetched = 0
}
