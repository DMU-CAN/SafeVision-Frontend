import type { MouseEvent } from 'react'
import type { CameraBox, ZonePoint } from '../../types'
import { useWebRTCStream } from '../../hooks/useWebRTCStream'
import './CameraGridBox.css'

interface CameraGridBoxProps {
  box: CameraBox
  zoneEditing?: boolean
  zoneDraftPoints?: ZonePoint[]
  existingZones?: ZonePoint[][]
  onZonePointAdd?: (point: ZonePoint) => void
  yoloEnabled?: boolean
  robotId?: number
}

export function CameraGridBox({ box, zoneEditing, zoneDraftPoints, existingZones, onZonePointAdd, yoloEnabled = true, robotId }: CameraGridBoxProps) {
  const cameraId = Number(box.id)
  const target = robotId !== undefined
    ? { kind: 'robot' as const, robotId }
    : Number.isFinite(cameraId) ? { kind: 'camera' as const, cameraId, yoloEnabled } : undefined
  const { videoRef, status } = useWebRTCStream(target)

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
    <div className={boxClass}>
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

      <video
        className="camera-box__stream"
        ref={videoRef}
        autoPlay
        playsInline
        muted
      />

      {status === 'connecting' && (
        <div className="camera-box__overlay">연결 중...</div>
      )}
      {status === 'error' && (
        <div className="camera-box__overlay camera-box__overlay--error">영상 연결 실패</div>
      )}

      {(zoneEditing || (existingZones && existingZones.length > 0)) && (
        <svg
          className={zoneEditing ? 'camera-box__zone-layer camera-box__zone-layer--editing' : 'camera-box__zone-layer'}
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
