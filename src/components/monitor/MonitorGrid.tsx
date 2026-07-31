import { useRef, useState, type MouseEvent } from 'react'
import { layoutOptions } from '../../data/mockData'
import type { Camera, SafetyEventRaw, Zone, ZonePoint } from '../../types'
import { API_BASE_URL } from '../../api/client'
import { CameraGridBox } from './CameraGridBox'
import './MonitorGrid.css'

const WINDOW_MINUTES = 30
const SCALE_LABELS = ['30분 전', '20분 전', '10분 전', '실시간']

interface MonitorGridProps {
  cameras: Camera[]
  selectedCameraId?: number | string | null
  zones?: Zone[]
  zoneEditing?: boolean
  zoneDraftPoints?: ZonePoint[]
  onZonePointAdd?: (point: ZonePoint) => void
  events?: SafetyEventRaw[]
  onPlayClip?: (clipUrl: string) => void
}

export function MonitorGrid({ cameras, selectedCameraId, zones, zoneEditing, zoneDraftPoints, onZonePointAdd, events, onPlayClip }: MonitorGridProps) {
  const [layout, setLayout] = useState('3x3')
  const [timeshiftMinutesAgo, setTimeshiftMinutesAgo] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const now = new Date()

  const recentEvents = (events ?? []).filter((event) => {
    if (event.cameraId !== selectedCameraId) return false
    const ageMinutes = (now.getTime() - new Date(event.createdAt).getTime()) / 60000
    return ageMinutes >= 0 && ageMinutes <= WINDOW_MINUTES
  })

  const percentForMinutesAgo = (minutesAgo: number) => ((WINDOW_MINUTES - minutesAgo) / WINDOW_MINUTES) * 100

  const handleTrackClick = (event: MouseEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const percent = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    const minutesAgo = Math.round(WINDOW_MINUTES * (1 - percent))
    setTimeshiftMinutesAgo(minutesAgo)
  }

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
            timeshiftMinutesAgo={isSelected ? timeshiftMinutesAgo : undefined}
          />
        )
      })}
    </div>
    <div className="layout-switcher"><span className="layout-switcher__label">화면 분할:</span>
      {layoutOptions.map((option) => <button key={option} type="button" className={option === layout ? 'layout-switcher__btn layout-switcher__btn--active' : 'layout-switcher__btn'} onClick={() => setLayout(option)}>{option}</button>)}
    </div>
    <div className="timeline-panel">
      <span className={timeshiftMinutesAgo === 0 ? 'timeline-panel__status timeline-panel__status--live' : 'timeline-panel__status'}>
        {timeshiftMinutesAgo === 0 ? '● 실시간' : `${timeshiftMinutesAgo}분 전`}
      </span>
      <div className="timeline-bar">
        <div className="timeline-bar__track" ref={trackRef} onClick={handleTrackClick}>
          <div className="timeline-bar__playhead" style={{ left: `${percentForMinutesAgo(timeshiftMinutesAgo)}%` }} />
          {recentEvents.map((event) => {
            const clipUrl = `${API_BASE_URL}/safety-events/${event.id}/clip`
            const ageMinutes = (now.getTime() - new Date(event.createdAt).getTime()) / 60000
            return (
              <button
                type="button"
                key={event.id}
                className="timeline-bar__event-marker"
                style={{ left: `${percentForMinutesAgo(ageMinutes)}%` }}
                title={`${event.eventType} ${new Date(event.createdAt).toLocaleTimeString()}`}
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation()
                  if (event.clipPath) onPlayClip?.(clipUrl)
                }}
                disabled={!event.clipPath}
              />
            )
          })}
        </div>
        <div className="timeline-bar__scale">{SCALE_LABELS.map((label) => <span key={label}>{label}</span>)}</div>
      </div>
      {timeshiftMinutesAgo > 0 && (
        <button type="button" className="timeline-panel__live-btn" onClick={() => setTimeshiftMinutesAgo(0)}>라이브로</button>
      )}
    </div>
  </section>
}
