import type { Camera, CameraStatus } from '../../types'
import './CameraSidebar.css'

const statusDotClass: Record<CameraStatus, string> = {
  online: 'status-dot status-dot--online', offline: 'status-dot status-dot--offline',
  maintenance: 'status-dot status-dot--offline', alert: 'status-dot status-dot--alert',
}

interface CameraSidebarProps {
  cameras: Camera[]
  loading?: boolean
  error?: string | null
  selectedCameraId?: number | string | null
  onSelectCamera?: (cameraId: number | string) => void
}

export function CameraSidebar({ cameras, loading, error, selectedCameraId, onSelectCamera }: CameraSidebarProps) {
  return <aside className="camera-sidebar">
    <div className="camera-sidebar__panel-header">카메라 목록 ({cameras.length})</div>
    <div className="camera-sidebar__search"><span>⌕</span><input type="text" placeholder="카메라 이름/IP 검색..." readOnly /></div>
    <div className="camera-sidebar__tree"><div className="camera-zone">
      <div className="camera-zone__title">▾ 전체 카메라</div>
      {loading && <div className="camera-sidebar__state">불러오는 중...</div>}
      {!loading && error && <div className="camera-sidebar__state camera-sidebar__state--error">{error}</div>}
      {!loading && !error && cameras.length === 0 && <div className="camera-sidebar__state">등록된 카메라가 없습니다.</div>}
      {!loading && !error && cameras.map((camera) => (
        <div
          key={camera.id}
          className={camera.id === selectedCameraId ? 'camera-row camera-row--selected' : 'camera-row'}
          onClick={() => onSelectCamera?.(camera.id)}
        >
          <span className="camera-row__label">▸ [CAM-{String(camera.id).padStart(2, '0')}] {camera.name}</span>
          <span className={statusDotClass[camera.status]} />
        </div>
      ))}
    </div></div>
  </aside>
}
