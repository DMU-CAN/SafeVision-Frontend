import { useEffect, useRef, useState, type MouseEvent } from 'react'
import type { CameraBox, ZonePoint } from '../../types'
import { useWebRTCStream } from '../../hooks/useWebRTCStream'
import { API_BASE_URL, withAccessToken } from '../../api/client'
import './CameraGridBox.css'

interface CameraGridBoxProps {
  box: CameraBox
  zoneEditing?: boolean
  zoneDraftPoints?: ZonePoint[]
  existingZones?: ZonePoint[][]
  onZonePointAdd?: (point: ZonePoint) => void
  yoloEnabled?: boolean
  robotId?: number
  /** > 0 switches this box from the live WebRTC stream to a generated clip
   * covering from this many minutes ago up to now (see cameras/{id}/timeshift). */
  timeshiftMinutesAgo?: number
}

interface ContentRect {
  top: number
  left: number
  width: number
  height: number
}

const FULL_RECT: ContentRect = { top: 0, left: 0, width: 100, height: 100 }

export function CameraGridBox({ box, zoneEditing, zoneDraftPoints, existingZones, onZonePointAdd, yoloEnabled = true, robotId, timeshiftMinutesAgo }: CameraGridBoxProps) {
  const cameraId = Number(box.id)
  const isTimeshift = !!timeshiftMinutesAgo && timeshiftMinutesAgo > 0
  const target = robotId !== undefined
    ? { kind: 'robot' as const, robotId }
    : (!isTimeshift && Number.isFinite(cameraId)) ? { kind: 'camera' as const, cameraId, yoloEnabled } : undefined
  const { videoRef, status } = useWebRTCStream(target)
  const timeshiftUrl = isTimeshift ? withAccessToken(`${API_BASE_URL}/cameras/${cameraId}/timeshift?minutesAgo=${timeshiftMinutesAgo}`) : undefined
  const [timeshiftError, setTimeshiftError] = useState(false)

  // object-fit: contain letterboxes the video inside the box whenever the
  // video's native aspect ratio doesn't match the box's — without this, the
  // zone overlay (which always fills the whole box) draws points/polygons
  // over the letterbox bars instead of over the actual picture, so clicks
  // and saved zone coordinates drift off from where they visually appear.
  const boxRef = useRef<HTMLDivElement>(null)
  const activeVideoRef = useRef<HTMLVideoElement>(null)
  const [contentRect, setContentRect] = useState<ContentRect>(FULL_RECT)

  useEffect(() => {
    setTimeshiftError(false)
    const boxEl = boxRef.current
    const videoEl = activeVideoRef.current
    if (!boxEl || !videoEl) return

    const recompute = () => {
      const { videoWidth, videoHeight } = videoEl
      const { clientWidth: boxWidth, clientHeight: boxHeight } = boxEl
      if (!videoWidth || !videoHeight || !boxWidth || !boxHeight) {
        setContentRect(FULL_RECT)
        return
      }
      const boxRatio = boxWidth / boxHeight
      const videoRatio = videoWidth / videoHeight
      if (videoRatio > boxRatio) {
        // Video relatively wider than the box: full width, letterboxed top/bottom.
        const heightPercent = (boxRatio / videoRatio) * 100
        setContentRect({ top: (100 - heightPercent) / 2, left: 0, width: 100, height: heightPercent })
      } else {
        // Video relatively taller than the box: full height, pillarboxed left/right.
        const widthPercent = (videoRatio / boxRatio) * 100
        setContentRect({ top: 0, left: (100 - widthPercent) / 2, width: widthPercent, height: 100 })
      }
    }

    recompute()
    videoEl.addEventListener('loadedmetadata', recompute)
    videoEl.addEventListener('resize', recompute)
    const resizeObserver = new ResizeObserver(recompute)
    resizeObserver.observe(boxEl)

    return () => {
      videoEl.removeEventListener('loadedmetadata', recompute)
      videoEl.removeEventListener('resize', recompute)
      resizeObserver.disconnect()
    }
  }, [isTimeshift, timeshiftUrl])

  const handleZoneClick = (event: MouseEvent<SVGSVGElement>) => {
    if (!zoneEditing || !onZonePointAdd) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 1000)
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 600)
    onZonePointAdd({ x, y })
  }
  const boxClass =
    box.state === 'active'
      ? 'camera-box camera-box--active'
      : box.state === 'alert'
        ? 'camera-box camera-box--alert'
        : 'camera-box'

  const labelClass =
    box.state === 'active'
      ? 'camera-box__label camera-box__label--accent'
      : box.state === 'alert'
        ? 'camera-box__label camera-box__label--danger'
        : 'camera-box__label'

  return (
    <div className={boxClass} ref={boxRef}>
      <div className="camera-box__header">
        <span className={labelClass}>{box.label}</span>
        {box.badge && (
          <span
            className={
              box.state === 'alert'
                ? 'camera-box__badge camera-box__badge--red'
                : 'camera-box__badge camera-box__badge--blue'
            }
          >
            {box.badge}
          </span>
        )}
      </div>

      {isTimeshift && (
        <div className="camera-box__replay-badge">{timeshiftMinutesAgo}분 전 재생</div>
      )}

      {isTimeshift ? (
        <video
          key={timeshiftUrl}
          className="camera-box__stream"
          ref={activeVideoRef}
          src={timeshiftUrl}
          controls
          autoPlay
          muted
          preload="auto"
          onError={() => setTimeshiftError(true)}
        />
      ) : (
        <video
          className="camera-box__stream"
          ref={(el) => { videoRef.current = el; activeVideoRef.current = el }}
          autoPlay
          playsInline
          muted
        />
      )}

      {!isTimeshift && status === 'connecting' && (
        <div className="camera-box__overlay">연결 중...</div>
      )}
      {!isTimeshift && status === 'error' && (
        <div className="camera-box__overlay camera-box__overlay--error">영상 연결 실패</div>
      )}

      {isTimeshift && timeshiftError && (
        <div className="camera-box__overlay camera-box__overlay--error">Playback failed</div>
      )}

      {(zoneEditing || (existingZones && existingZones.length > 0)) && (
        <svg
          className={zoneEditing ? 'camera-box__zone-layer camera-box__zone-layer--editing' : 'camera-box__zone-layer'}
          style={{
            top: `${contentRect.top}%`,
            left: `${contentRect.left}%`,
            width: `${contentRect.width}%`,
            height: `${contentRect.height}%`,
          }}
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          onClick={handleZoneClick}
        >
          {existingZones?.map((points, index) => (
            <polygon
              key={index}
              className="camera-box__zone-shape"
              points={points.map((point) => `${point.x},${point.y}`).join(' ')}
            />
          ))}
          {zoneDraftPoints && zoneDraftPoints.length > 0 && (
            <>
              <polyline
                className="camera-box__zone-draft"
                points={zoneDraftPoints.map((point) => `${point.x},${point.y}`).join(' ')}
              />
              {zoneDraftPoints.map((point, index) => (
                <circle key={index} className="camera-box__zone-point" cx={point.x} cy={point.y} r={6} />
              ))}
            </>
          )}
        </svg>
      )}

      {box.detection && (
        <div
          className={
            box.state === 'alert'
              ? 'camera-box__detection camera-box__detection--alert'
              : 'camera-box__detection camera-box__detection--active'
          }
        >
          <span className="camera-box__detection-tag">{box.detection.text}</span>
          <div className="camera-box__detection-box" />
        </div>
      )}
    </div>
  )
}
