import type { CameraBox } from '../../types'
import { API_BASE_URL } from '../../api/client'
import './CameraGridBox.css'

interface CameraGridBoxProps {
  box: CameraBox
}

export function CameraGridBox({ box }: CameraGridBoxProps) {
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

      <img
        className="camera-box__stream"
        src={`${API_BASE_URL}/cameras/${box.id}/mjpeg`}
        alt={`${box.label} 실시간 영상`}
        onError={(event) => { event.currentTarget.style.display = 'none' }}
      />

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
