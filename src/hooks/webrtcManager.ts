import { api } from '../api/client'

export type WebRTCStatus = 'connecting' | 'connected' | 'error'

interface Connection {
  pc: RTCPeerConnection
  stream: MediaStream | null
  status: WebRTCStatus
  sessionId?: string
  listeners: Set<() => void>
}

const connections = new Map<number, Connection>()

function notify(conn: Connection) {
  conn.listeners.forEach((listener) => listener())
}

async function connect(cameraId: number, conn: Connection) {
  conn.pc.addTransceiver('video', { direction: 'recvonly' })
  conn.pc.ontrack = (event) => {
    conn.stream = event.streams[0] ?? null
    notify(conn)
  }
  conn.pc.oniceconnectionstatechange = () => {
    if (conn.pc.iceConnectionState === 'failed' || conn.pc.iceConnectionState === 'disconnected') {
      conn.status = 'error'
      notify(conn)
    }
  }

  try {
    const offer = await conn.pc.createOffer()
    await conn.pc.setLocalDescription(offer)
    if (!offer.sdp) throw new Error('offer sdp missing')
    const answer = await api.webrtcOffer(offer.sdp, cameraId)
    conn.sessionId = answer.sessionId
    await conn.pc.setRemoteDescription({ sdp: answer.sdp, type: 'answer' })
    conn.status = 'connected'
    notify(conn)
  } catch {
    conn.status = 'error'
    notify(conn)
  }
}

/** Returns the shared connection for a camera, creating (and connecting) it
 * on first access. The connection is intentionally NOT tied to any component's
 * lifecycle — it stays open across screen/tab switches so cameras don't
 * reconnect every time the view changes. Use closeConnection/closeAllConnections
 * to explicitly tear one down (camera deleted, logout, etc). */
export function getConnection(cameraId: number): Connection {
  const existing = connections.get(cameraId)
  if (existing) return existing
  const conn: Connection = { pc: new RTCPeerConnection(), stream: null, status: 'connecting', listeners: new Set() }
  connections.set(cameraId, conn)
  connect(cameraId, conn)
  return conn
}

export function closeConnection(cameraId: number) {
  const conn = connections.get(cameraId)
  if (!conn) return
  conn.pc.close()
  if (conn.sessionId) api.delete(`/webrtc/sessions/${conn.sessionId}`).catch(() => undefined)
  connections.delete(cameraId)
}

export function closeAllConnections() {
  for (const cameraId of connections.keys()) closeConnection(cameraId)
}
