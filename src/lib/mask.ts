export function maskValue(value: string, fieldType: string): string {
  if (!value) return '***'
  if (fieldType === 'email') {
    const [local, domain] = value.split('@')
    if (!domain) return value.slice(0, 3) + '***'
    return local.slice(0, 3) + '***@' + domain
  }
  if (value.length <= 3) return '***'
  return value.slice(0, 2) + '***' + value.slice(-1)
}
