import { useState } from 'react'
import type { Camera, Zone, ZonePoint, ZoneType } from '../types'
import { CameraGridBox } from '../components/monitor/CameraGridBox'
import './ZoneSettingsPage.css'

const ZONE_TYPE_LABELS: Record<ZoneType, string> = {
  DANGER: '위험구역',
  RESTRICTED: '출입금지',
  WORK: '작업구역',
  OBSERVATION: '관찰구역',
}

interface ZoneSettingsPageProps {
  cameras: Camera[]
  camerasLoading?: boolean
  selectedCameraId: number | string | null
  onSelectCamera: (cameraId: number | string) => void
  zones: Zone[]
  zonesLoading?: boolean
  zonesError?: string | null
  zoneEditing: boolean
  zoneDraftPoints: ZonePoint[]
  onZonePointAdd: (point: ZonePoint) => void
  onStartZoneEditing: () => void
  onUndoZonePoint: () => void
  onCancelZoneEditing: () => void
  onSaveZone: (name: string, zoneType: ZoneType) => void
  onDeleteZone: (zoneId: number) => void
}

export function ZoneSettingsPage({
  cameras, camerasLoading, selectedCameraId, onSelectCamera,
  zones, zonesLoading, zonesError,
  zoneEditing, zoneDraftPoints, onZonePointAdd, onStartZoneEditing, onUndoZonePoint, onCancelZoneEditing, onSaveZone, onDeleteZone,
}: ZoneSettingsPageProps) {
  const [zoneName, setZoneName] = useState('위험 구역')
  const [zoneType, setZoneType] = useState<ZoneType>('DANGER')
  const selectedCamera = cameras.find((camera) => camera.id === selectedCameraId)
  const cameraZones = zones.filter((zone) => zone.cameraId === selectedCameraId)

  return (
    <main className="zone-settings">
      <span className="zone-settings__eyebrow">SAFE-VISION CONTROL CENTER</span>
      <h1>위험구역 설정</h1>

      <div className="zone-settings__body">
        <aside className="zone-settings__camera-list">
          <h2>카메라 선택</h2>
          {camerasLoading && <p className="zone-settings__hint">불러오는 중...</p>}
          {!camerasLoading && cameras.length === 0 && <p className="zone-settings__hint">등록된 카메라가 없습니다.</p>}
          {!camerasLoading && cameras.map((camera) => (
            <button
              key={camera.id}
              type="button"
              className={camera.id === selectedCameraId ? 'zone-settings__camera-item zone-settings__camera-item--active' : 'zone-settings__camera-item'}
              onClick={() => onSelectCamera(camera.id)}
            >
              CAM-{String(camera.id).padStart(2, '0')} {camera.name}
            </button>
          ))}
        </aside>

        <section className="zone-settings__stage">
          {!selectedCamera && <p className="zone-settings__hint">카메라를 선택하세요.</p>}
          {selectedCamera && (
            <>
              <div className="zone-settings__video">
                <CameraGridBox
                  box={{ id: String(selectedCamera.id), label: `CAM-${String(selectedCamera.id).padStart(2, '0')} ${selectedCamera.name}`, state: 'normal' }}
                  zoneEditing={zoneEditing}
                  zoneDraftPoints={zoneDraftPoints}
                  existingZones={cameraZones.map((zone) => zone.points)}
                  onZonePointAdd={onZonePointAdd}
                />
              </div>

              <div className="zone-settings__controls">
                {!zoneEditing && (
                  <button type="button" onClick={onStartZoneEditing}>영상에서 점 찍어 구역 지정 시작</button>
                )}
                {zoneEditing && (
                  <div className="zone-settings__editor">
                    <p className="zone-settings__hint">영상을 클릭해서 점을 찍으세요 ({zoneDraftPoints.length}개 / 최소 3개)</p>
                    <input value={zoneName} onChange={(event) => setZoneName(event.target.value)} placeholder="구역 이름" />
                    <select value={zoneType} onChange={(event) => setZoneType(event.target.value as ZoneType)}>
                      {(Object.keys(ZONE_TYPE_LABELS) as ZoneType[]).map((type) => (
                        <option key={type} value={type}>{ZONE_TYPE_LABELS[type]}</option>
                      ))}
                    </select>
                    <div className="zone-settings__actions">
                      <button type="button" onClick={onUndoZonePoint} disabled={zoneDraftPoints.length === 0}>마지막 점 취소</button>
                      <button type="button" onClick={() => zoneDraftPoints.length >= 3 && onSaveZone(zoneName, zoneType)} disabled={zoneDraftPoints.length < 3}>구역 저장</button>
                      <button type="button" onClick={onCancelZoneEditing}>취소</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="zone-settings__list">
                <h2>등록된 위험 구역</h2>
                {zonesLoading && <p className="zone-settings__hint">불러오는 중...</p>}
                {!zonesLoading && zonesError && <p className="zone-settings__error">{zonesError}</p>}
                {!zonesLoading && !zonesError && cameraZones.length === 0 && <p className="zone-settings__hint">등록된 위험 구역이 없습니다.</p>}
                {!zonesLoading && !zonesError && cameraZones.map((zone) => (
                  <div className="zone-settings__row" key={zone.id}>
                    <span>{zone.name} <small className="zone-settings__type">{ZONE_TYPE_LABELS[zone.zoneType]}</small></span>
                    <button type="button" onClick={() => onDeleteZone(zone.id)}>삭제</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
