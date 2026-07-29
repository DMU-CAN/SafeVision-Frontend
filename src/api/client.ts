export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

type ApiEnvelope<T> = { success: boolean; data: T; message?: string }

let accessToken = localStorage.getItem('accessToken')
let refreshToken = localStorage.getItem('refreshToken')

export function setAuthTokens(access: string | null, refresh: string | null) {
  accessToken = access
  refreshToken = refresh
  if (access) localStorage.setItem('accessToken', access)
  else localStorage.removeItem('accessToken')
  if (refresh) localStorage.setItem('refreshToken', refresh)
  else localStorage.removeItem('refreshToken')
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  if (response.status === 401 && retry && refreshToken) {
    const refreshed = await request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST', body: JSON.stringify({ refreshToken }),
    }, false)
    // Refresh rotation is not supported by the current API. If the backend
    // starts rotating refresh tokens, read and persist the new refreshToken here.
    setAuthTokens(refreshed.accessToken, refreshToken)
    return request<T>(path, init, false)
  }
  if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`)
  if (response.status === 204) return undefined as T
  const envelope = await response.json() as ApiEnvelope<T>
  return envelope.data
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
  login: async (username: string, password: string) => {
    const data = await request<{ accessToken: string; refreshToken: string; user: unknown }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
    setAuthTokens(data.accessToken, data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },
}
