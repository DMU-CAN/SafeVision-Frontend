import { useState } from 'react'
import { layoutOptions, timelineScale } from '../../data/mockData'
import type { Camera, Zone, ZonePoint } from '../../types'
import { CameraGridBox } from './CameraGridBox'
import './MonitorGrid.css'

interface MonitorGridProps {
  cameras: Camera[]
  selectedCameraId?: number | string | null
  zones?: Zone[]
  zoneEditing?: boolean
  zoneDraftPoints?: ZonePoint[]
  onZonePointAdd?: (point: ZonePoint) => void
}

export function MonitorGrid({ cameras, selectedCameraId, zones, zoneEditing, zoneDraftPoints, onZonePointAdd }: MonitorGridProps) {
  const [layout, setLayout] = useState('3x3')
  return <section className="monitor-grid">
    <div className={`camera-grid camera-grid--${layout.replace('x', '-')}`}>
      {cameras.map((camera) => {
        const isSelected = camera.id === selectedCameraId
        return (
          <CameraGridBox
            key={camera.id}
            box={{ id: String(camera.id), label: `CAM-${String(camera.id).padStart(2, '0')} ${camera.name}`, state: isSelected ? 'active' : 'normal' }}
            zoneEditing={isSelected && zoneEditing}
            zoneDraftPoints={isSelected ? zoneDraftPoints : undefined}
            existingZones={isSelected ? zones?.filter((zone) => zone.cameraId === camera.id).map((zone) => zone.points) : undefined}
            onZonePointAdd={isSelected ? onZonePointAdd : undefined}
          />
        )
      })}
    </div>
    <div className="layout-switcher"><span className="layout-switcher__label">화면 분할:</span>
      {layoutOptions.map((option) => <button key={option} type="button" className={option === layout ? 'layout-switcher__btn layout-switcher__btn--active' : 'layout-switcher__btn'} onClick={() => setLayout(option)}>{option}</button>)}
    </div>
    <div className="timeline-panel"><div className="timeline-bar"><div className="timeline-bar__track"><div className="timeline-bar__recorded" /><div className="timeline-bar__event-marker" /><div className="timeline-bar__playhead" /></div><div className="timeline-bar__scale">{timelineScale.map((label) => <span key={label}>{label}</span>)}</div></div></div>
  </section>
}
