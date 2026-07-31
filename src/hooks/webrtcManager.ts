import { api } from '../api/client'

export type WebRTCStatus = 'connecting' | 'connected' | 'error'

export type StreamTarget =
  | { kind: 'camera'; cameraId: number; yoloEnabled?: boolean }
  | { kind: 'robot'; robotId: number }

export function streamTargetKey(target: StreamTarget): string {
  return target.kind === 'camera'
    ? `camera:${target.cameraId}:${target.yoloEnabled === false ? 'raw' : 'yolo'}`
    : `robot:${target.robotId}`
}

interface Connection {
  pc: RTCPeerConnection
  stream: MediaStream | null
  status: WebRTCStatus
  sessionId?: string
  listeners: Set<() => void>
}

const connections = new Map<string, Connection>()

const TURN_ENABLED = import.meta.env.VITE_TURN_ENABLED === 'true'
const TURN_URL = import.meta.env.VITE_TURN_URL || 'turn:safevision.kro.kr:3478?transport=tcp'
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || 'safevision'
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || 'change-this-password'

function notify(conn: Connection) {
  conn.listeners.forEach((listener) => listener())
}

function createPeerConnection(): RTCPeerConnection {
  if (!TURN_ENABLED) return new RTCPeerConnection()

  return new RTCPeerConnection({
    iceServers: [{
      urls: TURN_URL,
      username: TURN_USERNAME,
      credential: TURN_CREDENTIAL,
    }],
  })
}

async function connect(target: StreamTarget, conn: Connection) {
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
    const answer = await api.webrtcOffer(offer.sdp, target)
    conn.sessionId = answer.sessionId
    await conn.pc.setRemoteDescription({ sdp: answer.sdp, type: 'answer' })
    conn.status = 'connected'
    notify(conn)
  } catch {
    conn.status = 'error'
    notify(conn)
  }
}

/** Returns the shared connection for a stream target (camera, optionally
 * without YOLO overlay, or a robot's onboard camera), creating (and
 * connecting) it on first access. The connection is intentionally NOT tied
 * to any component's lifecycle — it stays open across screen/tab switches
 * so streams don't reconnect every time the view changes. Use
 * closeConnection/closeAllConnections to explicitly tear one down. */
export function getConnection(target: StreamTarget): Connection {
  const key = streamTargetKey(target)
  const existing = connections.get(key)
  if (existing) return existing
  const conn: Connection = { pc: createPeerConnection(), stream: null, status: 'connecting', listeners: new Set() }
  connections.set(key, conn)
  connect(target, conn)
  return conn
}

export function closeConnection(target: StreamTarget) {
  const key = streamTargetKey(target)
  const conn = connections.get(key)
  if (!conn) return
  conn.pc.close()
  if (conn.sessionId) api.delete(`/webrtc/sessions/${conn.sessionId}`).catch(() => undefined)
  connections.delete(key)
}

export function closeAllConnections() {
  for (const conn of connections.values()) {
    conn.pc.close()
    if (conn.sessionId) api.delete(`/webrtc/sessions/${conn.sessionId}`).catch(() => undefined)
  }
  connections.clear()
}
