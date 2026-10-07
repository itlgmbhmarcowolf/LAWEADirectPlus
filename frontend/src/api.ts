let csrf: string | null = null
export const setCsrf = (value: string | null) => { csrf = value }

export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string) { super(message) }
}

export async function api<T>(route: string, options: RequestInit = {}): Promise<T> {
  if (!route.startsWith('/') || route.startsWith('//')) throw new Error('Ungültiger API-Pfad')
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD'].includes(method) && csrf) headers.set('X-CSRF-Token', csrf)
  const response = await fetch(`/api${route}`, { ...options, headers, credentials: 'same-origin', cache: 'no-store' })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string; code?: string }
    throw new ApiError(body.message || 'Die Anfrage ist fehlgeschlagen.', response.status, body.code || 'ERROR')
  }
  return response.json() as Promise<T>
}

export const post = <T>(route: string, body: unknown) => api<T>(route, { method: 'POST', body: JSON.stringify(body) })
export const put = <T>(route: string, body: unknown) => api<T>(route, { method: 'PUT', body: JSON.stringify(body) })
export const upload = <T>(route: string, form: FormData) => api<T>(route, { method: 'POST', body: form })

export async function fetchDocument(route: string): Promise<Blob> {
  if (!route.startsWith('/') || route.startsWith('//')) throw new Error('Ungültiger API-Pfad')
  const response = await fetch(`/api${route}`, { credentials: 'same-origin', cache: 'no-store' })
  if (!response.ok) throw new Error('Dokument konnte nicht geladen werden.')
  return response.blob()
}

export async function download(route: string, filename: string) {
  const blob = await fetchDocument(route)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}
