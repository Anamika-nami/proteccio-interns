const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

export function rateLimit(ip: string, limit = 60, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now - entry.timestamp > windowMs) {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

export function getIP(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
}
