import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import type { Camera, Zone, ZonePoint } from '../../types'
import './ControlPanel.css'

interface ControlPanelProps {
  cameras: Camera[]
  selectedCameraId?: number | string | null
  zones: Zone[]
  zonesLoading?: boolean
  zonesError?: string | null
  zoneEditing: boolean
  zoneDraftPoints: ZonePoint[]
  onStartZoneEditing: () => void
  onUndoZonePoint: () => void
  onCancelZoneEditing: () => void
  onSaveZone: (name: string) => void
  onDeleteZone: (zoneId: number) => void
  onRegisterCamera: (payload: { name: string; rtspUrl: string; location: string }) => Promise<void>
}

export function ControlPanel({
  cameras, selectedCameraId, zones, zonesLoading, zonesError,
  zoneEditing, zoneDraftPoints, onStartZoneEditing, onUndoZonePoint, onCancelZoneEditing, onSaveZone, onDeleteZone,
  onRegisterCamera,
}: ControlPanelProps) {
  const [zoneName, setZoneName] = useState('위험 구역')
  const [cameraForm, setCameraForm] = useState({ name: '', rtspUrl: '', location: '' })
  const [cameraFormError, setCameraFormError] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)

  const selectedCamera = cameras.find((camera) => camera.id === selectedCameraId)
  const cameraZones = zones.filter((zone) => zone.cameraId === selectedCameraId)

  const handleRegisterCamera = async (event: FormEvent) => {
    event.preventDefault()
    setCameraFormError(null)
    setRegistering(true)
    try {
      await onRegisterCamera(cameraForm)
      setCameraForm({ name: '', rtspUrl: '', location: '' })
    } catch {
      setCameraFormError('카메라 등록에 실패했습니다.')
    } finally {
      setRegistering(false)
    }
  }

  const handleSaveZone = () => {
    if (zoneDraftPoints.length < 3) return
    onSaveZone(zoneName)
  }

  const control = (action: 'stop' | 'slow' | 'resume') => api.post(`/equipment/${action}`, {}).catch(() => undefined)

  return <section className="control-panel">
    <div className="control-panel__section">
      <h3>카메라 등록</h3>
      <form className="control-panel__form control-panel__form--stack" onSubmit={handleRegisterCamera}>
        <input placeholder="이름" value={cameraForm.name} onChange={(event) => setCameraForm({ ...cameraForm, name: event.target.value })} required />
        <input placeholder="RTSP URL" value={cameraForm.rtspUrl} onChange={(event) => setCameraForm({ ...cameraForm, rtspUrl: event.target.value })} required />
        <input placeholder="위치" value={cameraForm.location} onChange={(event) => setCameraForm({ ...cameraForm, location: event.target.value })} required />
        <button type="submit" disabled={registering}>{registering ? '등록 중...' : '카메라 등록'}</button>
      </form>
      {cameraFormError && <p className="control-panel__error">{cameraFormError}</p>}
    </div>

    <div className="control-panel__section">
      <h3>위험 구역 {selectedCamera ? `(${selectedCamera.name})` : ''}</h3>
      {!selectedCamera && <p className="control-panel__hint">카메라를 먼저 선택하세요.</p>}

      {selectedCamera && !zoneEditing && (
        <button type="button" onClick={onStartZoneEditing}>영상에서 점 찍어 구역 지정 시작</button>
      )}

      {selectedCamera && zoneEditing && (
        <div className="control-panel__zone-editor">
          <p className="control-panel__hint">선택된 카메라 화면을 클릭해서 점을 찍으세요 ({zoneDraftPoints.length}개 / 최소 3개)</p>
          <div className="control-panel__form">
            <input value={zoneName} onChange={(event) => setZoneName(event.target.value)} placeholder="구역 이름" />
          </div>
          <div className="control-panel__actions">
            <button type="button" onClick={onUndoZonePoint} disabled={zoneDraftPoints.length === 0}>마지막 점 취소</button>
            <button type="button" onClick={handleSaveZone} disabled={zoneDraftPoints.length < 3}>구역 저장</button>
            <button type="button" onClick={onCancelZoneEditing}>취소</button>
          </div>
        </div>
      )}

      {zonesLoading && <p className="control-panel__hint">불러오는 중...</p>}
      {!zonesLoading && zonesError && <p className="control-panel__error">{zonesError}</p>}
      {!zonesLoading && !zonesError && cameraZones.length === 0 && <p className="control-panel__hint">등록된 위험 구역이 없습니다.</p>}
      {!zonesLoading && !zonesError && cameraZones.map((zone) => (
        <div className="control-panel__row" key={zone.id}>
          <span>{zone.name}</span>
          <button type="button" onClick={() => onDeleteZone(zone.id)}>삭제</button>
        </div>
      ))}
    </div>

    <div className="control-panel__section">
      <h3>설비 제어</h3>
      <div className="control-panel__actions">
        <button type="button" className="danger" onClick={() => control('stop')}>정지</button>
        <button type="button" onClick={() => control('slow')}>감속</button>
        <button type="button" onClick={() => control('resume')}>재가동</button>
      </div>
    </div>
  </section>
}
