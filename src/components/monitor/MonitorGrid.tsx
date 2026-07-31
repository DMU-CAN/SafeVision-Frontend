import { useState } from 'react'
import { layoutOptions } from '../../data/mockData'
import type { Camera, SafetyEventRaw, Zone, ZonePoint } from '../../types'
import { API_BASE_URL } from '../../api/client'
import { CameraGridBox } from './CameraGridBox'
import './MonitorGrid.css'

const DAY_SCALE_LABELS = ['00:00', '06:00', '12:00', '18:00', '24:00']

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60
}

function isToday(date: Date, now: Date): boolean {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
}

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
  const now = new Date()
  const nowPercent = (minutesSinceMidnight(now) / 1440) * 100
  const todaysEvents = (events ?? []).filter((event) => event.cameraId === selectedCameraId && isToday(new Date(event.createdAt), now))

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
    <div className="timeshift-control">
      <span className="timeshift-control__label">{timeshiftMinutesAgo === 0 ? '● 실시간' : `${timeshiftMinutesAgo}분 전`}</span>
      <input
        type="range"
        min={0}
        max={30}
        step={1}
        value={timeshiftMinutesAgo}
        onChange={(event) => setTimeshiftMinutesAgo(Number(event.target.value))}
      />
      <span className="timeshift-control__scale-label">30분 전</span>
      {timeshiftMinutesAgo > 0 && (
        <button type="button" className="timeshift-control__live-btn" onClick={() => setTimeshiftMinutesAgo(0)}>라이브로</button>
      )}
    </div>
    <div className="timeline-panel">
      <div className="timeline-bar">
        <div className="timeline-bar__track">
          <div className="timeline-bar__playhead" style={{ left: `${nowPercent}%` }} title={`현재 ${now.toLocaleTimeString()}`} />
          {todaysEvents.map((event) => {
            const clipUrl = `${API_BASE_URL}/safety-events/${event.id}/clip`
            const percent = (minutesSinceMidnight(new Date(event.createdAt)) / 1440) * 100
            return (
              <button
                type="button"
                key={event.id}
                className="timeline-bar__event-marker"
                style={{ left: `${percent}%` }}
                title={`${event.eventType} ${new Date(event.createdAt).toLocaleTimeString()}`}
                onClick={() => event.clipPath && onPlayClip?.(clipUrl)}
                disabled={!event.clipPath}
              />
            )
          })}
        </div>
        <div className="timeline-bar__scale">{DAY_SCALE_LABELS.map((label) => <span key={label}>{label}</span>)}</div>
      </div>
    </div>
  </section>
}
