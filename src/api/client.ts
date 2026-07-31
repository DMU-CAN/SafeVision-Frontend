import type { User } from '../types'
import type { StreamTarget } from '../hooks/webrtcManager'

// Defaults to whatever host/protocol the page itself was loaded from (LAN IP,
// external domain, etc.) rather than a fixed IP baked in at build time — a
// hardcoded internal IP works from the LAN but times out for anyone reaching
// the frontend through port-forwarding/a public domain, since that address
// isn't routable from outside the LAN. VITE_API_BASE_URL still overrides this
// for cases where the backend genuinely lives on a different host (e.g. a
// local dev machine pointing at a remote Pi backend).
function computeDefaultApiBaseUrl(): string {
  const { protocol, hostname } = window.location
  return `${protocol}//${hostname}:8080/api/v1`
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || computeDefaultApiBaseUrl()
export const UNAUTHORIZED_EVENT = 'sv:unauthorized'

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

function clearAuth() {
  setAuthTokens(null, null)
  localStorage.removeItem('user')
}

export function isAuthenticated() {
  return !!accessToken
}

// For <video>/<img> src="..." requests (timeshift clips, event clips) that
// can't set an Authorization header — the backend accepts the token as an
// ?access_token= query param for exactly this case (see app/api/deps.py).
export function withAccessToken(url: string): string {
  if (!accessToken) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}access_token=${encodeURIComponent(accessToken)}`
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  if (response.status === 401) {
    if (retry && refreshToken) {
      try {
        const refreshed = await request<{ accessToken: string }>('/auth/refresh', {
          method: 'POST', body: JSON.stringify({ refreshToken }),
        }, false)
        // Refresh rotation is not supported by the current API. If the backend
        // starts rotating refresh tokens, read and persist the new refreshToken here.
        setAuthTokens(refreshed.accessToken, refreshToken)
        return request<T>(path, init, false)
      } catch {
        clearAuth()
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
        throw new Error('Unauthorized')
      }
    }
    clearAuth()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw new Error('Unauthorized')
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
    const data = await request<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
    setAuthTokens(data.accessToken, data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },
  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' })
    } finally {
      clearAuth()
    }
  },
  webrtcOffer: (sdp: string, target: StreamTarget) =>
    request<{ sdp: string; type: string; sessionId: string }>('/webrtc/offer', {
      method: 'POST',
      body: JSON.stringify(
        target.kind === 'camera'
          ? { sdp, type: 'offer', cameraId: target.cameraId, yoloEnabled: target.yoloEnabled ?? true }
          : { sdp, type: 'offer', robotId: target.robotId },
      ),
    }),
}
