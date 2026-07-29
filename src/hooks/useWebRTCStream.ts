import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

export type WebRTCStatus = 'connecting' | 'connected' | 'error'

export function useWebRTCStream(cameraId: number | undefined) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<WebRTCStatus>('connecting')

  useEffect(() => {
    if (cameraId === undefined) return

    let cancelled = false
    let pc: RTCPeerConnection | null = null
    let sessionId: string | undefined

    async function connect() {
      setStatus('connecting')
      pc = new RTCPeerConnection()
      pc.addTransceiver('video', { direction: 'recvonly' })
      pc.ontrack = (event) => {
        if (videoRef.current) videoRef.current.srcObject = event.streams[0]
      }
      pc.oniceconnectionstatechange = () => {
        if (pc && (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected')) {
          setStatus('error')
        }
      }

      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        if (!offer.sdp) throw new Error('offer sdp missing')
        const answer = await api.webrtcOffer(offer.sdp, cameraId as number)
        if (cancelled) return
        sessionId = answer.sessionId
        await pc.setRemoteDescription({ sdp: answer.sdp, type: 'answer' })
        if (!cancelled) setStatus('connected')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    // Delay the actual connection by a macrotask so React StrictMode's dev-only
    // double mount (mount -> cleanup -> mount) cancels the first, throwaway
    // run before it ever reaches the network — otherwise two concurrent
    // /webrtc/offer calls race for the same camera source and one gets a 400.
    const timer = setTimeout(connect, 0)

    return () => {
      cancelled = true
      clearTimeout(timer)
      pc?.close()
      if (sessionId) api.delete(`/webrtc/sessions/${sessionId}`).catch(() => undefined)
    }
  }, [cameraId])

  return { videoRef, status }
}
