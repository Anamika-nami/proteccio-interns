// ============================================
// IN-MEMORY CACHE LAYER
// ============================================
// Simple but effective caching for frequently accessed data

type CacheEntry<T> = {
  data: T
  timestamp: number
  ttl: number
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private maxSize: number = 1000 // Prevent memory leaks

  /**
   * Get cached data if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }

  /**
   * Set cache with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate all keys matching pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Singleton instance
export const cache = new CacheManager()

// ============================================
// CACHE KEY GENERATORS
// ============================================

export const CacheKeys = {
  // Config cache (5 minutes)
  appConfig: () => 'app:config',
  
  // User cache (2 minutes)
  userRole: (userId: string) => `user:${userId}:role`,
  userProfile: (userId: string) => `user:${userId}:profile`,
  
  // Intern cache (1 minute)
  internProfile: (internId: string) => `intern:${internId}:profile`,
  internList: (filters: string) => `intern:list:${filters}`,
  internAnalytics: (internId: string) => `intern:${internId}:analytics`,
  
  // Dashboard cache (30 seconds)
  dashboardMetrics: () => 'dashboard:metrics',
  dashboardActivity: () => 'dashboard:activity',
  
  // Analytics cache (5 minutes)
  analyticsSummary: (filters: string) => `analytics:summary:${filters}`,
  analyticsTrends: () => 'analytics:trends',
  
  // Tasks cache (30 seconds)
  tasksList: (userId: string, filters: string) => `tasks:${userId}:${filters}`,
  
  // Notifications cache (10 seconds)
  notificationsList: (userId: string) => `notifications:${userId}`,
  notificationsUnread: (userId: string) => `notifications:${userId}:unread`
}

// ============================================
// CACHE TTL CONSTANTS (milliseconds)
// ============================================

export const CacheTTL = {
  SHORT: 10 * 1000,      // 10 seconds - real-time data
  MEDIUM: 60 * 1000,     // 1 minute - frequently changing
  LONG: 5 * 60 * 1000,   // 5 minutes - relatively stable
  VERY_LONG: 15 * 60 * 1000  // 15 minutes - rarely changes
}

// ============================================
// CACHE HELPER FUNCTIONS
// ============================================

/**
 * Get or fetch pattern - reduces boilerplate
 */
export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CacheTTL.MEDIUM
): Promise<T> {
  // Try cache first
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch and cache
  const data = await fetcher()
  cache.set(key, data, ttl)
  return data
}

/**
 * Invalidate related caches when data changes
 */
export function invalidateRelated(entity: string, id?: string): void {
  if (id) {
    cache.invalidatePattern(`${entity}:${id}:.*`)
  }
  cache.invalidatePattern(`${entity}:list:.*`)
  cache.invalidatePattern(`${entity}:summary:.*`)
}
