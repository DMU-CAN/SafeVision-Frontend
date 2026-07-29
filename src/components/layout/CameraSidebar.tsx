import type { Camera, CameraStatus } from '../../types'
import './CameraSidebar.css'

const statusDotClass: Record<CameraStatus, string> = {
  online: 'status-dot status-dot--online', offline: 'status-dot status-dot--offline',
  maintenance: 'status-dot status-dot--offline', alert: 'status-dot status-dot--alert',
}

export function CameraSidebar({ cameras }: { cameras: Camera[] }) {
  return <aside className="camera-sidebar">
    <div className="camera-sidebar__panel-header">카메라 목록 ({cameras.length})</div>
    <div className="camera-sidebar__search"><span>⌕</span><input type="text" placeholder="카메라 이름/IP 검색..." readOnly /></div>
    <div className="camera-sidebar__tree"><div className="camera-zone">
      <div className="camera-zone__title">▾ 전체 카메라</div>
      {cameras.map((camera) => <div key={camera.id} className="camera-row">
        <span className="camera-row__label">▸ [CAM-{String(camera.id).padStart(2, '0')}] {camera.name}</span>
        <span className={statusDotClass[camera.status]} />
      </div>)}
    </div></div>
  </aside>
}
