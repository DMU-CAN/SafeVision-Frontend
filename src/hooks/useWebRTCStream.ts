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

    connect()

    return () => {
      cancelled = true
      pc?.close()
      if (sessionId) api.delete(`/webrtc/sessions/${sessionId}`).catch(() => undefined)
    }
  }, [cameraId])

  return { videoRef, status }
}
