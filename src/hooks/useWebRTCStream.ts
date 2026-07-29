import { useEffect, useRef, useState } from 'react'
import { getConnection, streamTargetKey, type StreamTarget, type WebRTCStatus } from './webrtcManager'

export type { WebRTCStatus }

export function useWebRTCStream(target: StreamTarget | undefined) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<WebRTCStatus>('connecting')
  const targetKey = target ? streamTargetKey(target) : undefined

  useEffect(() => {
    if (!target) return

    let unsubscribe: (() => void) | undefined

    // Delay by a macrotask so React StrictMode's dev-only double mount
    // (mount -> cleanup -> mount) is harmless here: the connection is shared
    // and keyed by the target, so a throwaway subscribe/unsubscribe pair
    // never creates a second peer connection.
    const timer = setTimeout(() => {
      const conn = getConnection(target)
      const sync = () => {
        setStatus(conn.status)
        if (videoRef.current && conn.stream && videoRef.current.srcObject !== conn.stream) {
          videoRef.current.srcObject = conn.stream
        }
      }
      conn.listeners.add(sync)
      sync()
      unsubscribe = () => conn.listeners.delete(sync)
    }, 0)

    return () => {
      clearTimeout(timer)
      unsubscribe?.()
      // Intentionally not closing the underlying RTCPeerConnection here —
      // webrtcManager keeps it alive across screen/tab switches so the
      // stream doesn't reconnect every time the view changes.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey])

  return { videoRef, status }
}
