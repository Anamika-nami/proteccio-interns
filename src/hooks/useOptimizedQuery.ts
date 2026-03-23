// ============================================
// OPTIMIZED DATA FETCHING HOOK
// ============================================
// Features:
// - Automatic caching
// - Deduplication
// - Stale-while-revalidate
// - Error retry
// - Loading states

import { useState, useEffect, useCallback, useRef } from 'react'

type QueryOptions<T> = {
  cacheKey: string
  fetcher: () => Promise<T>
  cacheTTL?: number // milliseconds
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  retry?: number
  retryDelay?: number
}

type QueryResult<T> = {
  data: T | null
  error: Error | null
  isLoading: boolean
  isValidating: boolean
  refetch: () => Promise<void>
  mutate: (data: T) => void
}

// Simple in-memory cache
const queryCache = new Map<string, { data: any; timestamp: number }>()

// Deduplication: track in-flight requests
const inflightRequests = new Map<string, Promise<any>>()

export function useOptimizedQuery<T>(options: QueryOptions<T>): QueryResult<T> {
  const {
    cacheKey,
    fetcher,
    cacheTTL = 60000, // 1 minute default
    enabled = true,
    onSuccess,
    onError,
    retry = 3,
    retryDelay = 1000
  } = options

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  
  const retryCountRef = useRef(0)
  const mountedRef = useRef(true)

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!enabled) return

    // Check cache first (stale-while-revalidate)
    const cached = queryCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      setData(cached.data)
      setIsLoading(false)
      
      // Still revalidate in background if stale
      if (Date.now() - cached.timestamp > cacheTTL / 2) {
        setIsValidating(true)
      } else {
        return // Fresh cache, no need to fetch
      }
    } else {
      if (!isRefetch) setIsLoading(true)
    }

    try {
      // Check if request is already in-flight (deduplication)
      let dataPromise = inflightRequests.get(cacheKey)
      
      if (!dataPromise) {
        dataPromise = fetcher()
        inflightRequests.set(cacheKey, dataPromise)
      }

      const result = await dataPromise
      
      if (!mountedRef.current) return

      // Update cache
      queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      })

      setData(result)
      setError(null)
      retryCountRef.current = 0
      
      if (onSuccess) onSuccess(result)

    } catch (err) {
      if (!mountedRef.current) return

      const error = err instanceof Error ? err : new Error('Unknown error')
      
      // Retry logic
      if (retryCountRef.current < retry) {
        retryCountRef.current++
        setTimeout(() => fetchData(isRefetch), retryDelay * retryCountRef.current)
        return
      }

      setError(error)
      if (onError) onError(error)

    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
        setIsValidating(false)
        inflightRequests.delete(cacheKey)
      }
    }
  }, [cacheKey, fetcher, cacheTTL, enabled, onSuccess, onError, retry, retryDelay])

  const refetch = useCallback(async () => {
    // Clear cache and refetch
    queryCache.delete(cacheKey)
    await fetchData(true)
  }, [cacheKey, fetchData])

  const mutate = useCallback((newData: T) => {
    // Optimistic update
    setData(newData)
    queryCache.set(cacheKey, {
      data: newData,
      timestamp: Date.now()
    })
  }, [cacheKey])

  useEffect(() => {
    mountedRef.current = true
    fetchData()

    return () => {
      mountedRef.current = false
    }
  }, [fetchData])

  return {
    data,
    error,
    isLoading,
    isValidating,
    refetch,
    mutate
  }
}

// ============================================
// BATCH QUERY HOOK
// ============================================
// Fetch multiple queries in parallel

export function useBatchQuery<T extends Record<string, any>>(
  queries: Record<keyof T, QueryOptions<T[keyof T]>>
): Record<keyof T, QueryResult<T[keyof T]>> {
  const results = {} as Record<keyof T, QueryResult<T[keyof T]>>

  for (const key in queries) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    results[key] = useOptimizedQuery(queries[key])
  }

  return results
}

// ============================================
// INFINITE QUERY HOOK
// ============================================
// For paginated data

type InfiniteQueryOptions<T> = {
  cacheKey: string
  fetcher: (page: number) => Promise<T[]>
  pageSize?: number
  enabled?: boolean
}

type InfiniteQueryResult<T> = {
  data: T[]
  error: Error | null
  isLoading: boolean
  isFetchingMore: boolean
  hasMore: boolean
  fetchMore: () => Promise<void>
  refetch: () => Promise<void>
}

export function useInfiniteQuery<T>(
  options: InfiniteQueryOptions<T>
): InfiniteQueryResult<T> {
  const { cacheKey, fetcher, pageSize = 20, enabled = true } = options

  const [data, setData] = useState<T[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const fetchPage = useCallback(async (pageNum: number, append = false) => {
    if (!enabled) return

    if (append) {
      setIsFetchingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const result = await fetcher(pageNum)
      
      setData(prev => append ? [...prev, ...result] : result)
      setHasMore(result.length === pageSize)
      setError(null)

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }, [fetcher, pageSize, enabled])

  const fetchMore = useCallback(async () => {
    if (!hasMore || isFetchingMore) return
    const nextPage = page + 1
    setPage(nextPage)
    await fetchPage(nextPage, true)
  }, [page, hasMore, isFetchingMore, fetchPage])

  const refetch = useCallback(async () => {
    setPage(1)
    await fetchPage(1, false)
  }, [fetchPage])

  useEffect(() => {
    fetchPage(1, false)
  }, [fetchPage])

  return {
    data,
    error,
    isLoading,
    isFetchingMore,
    hasMore,
    fetchMore,
    refetch
  }
}
