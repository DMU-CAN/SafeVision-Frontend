import type { CameraBox } from '../../types'
import { useWebRTCStream } from '../../hooks/useWebRTCStream'
import './CameraGridBox.css'

interface CameraGridBoxProps {
  box: CameraBox
}

export function CameraGridBox({ box }: CameraGridBoxProps) {
  const cameraId = Number(box.id)
  const { videoRef, status } = useWebRTCStream(Number.isFinite(cameraId) ? cameraId : undefined)
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
