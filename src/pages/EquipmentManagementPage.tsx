import { useState, type FormEvent } from 'react'
import type { Camera, Robot } from '../types'
import './EquipmentManagementPage.css'

interface EquipmentManagementPageProps {
  cameras: Camera[]
  camerasLoading?: boolean
  camerasError?: string | null
  onRegisterCamera: (payload: { name: string; rtspUrl: string; location: string; locationX?: number; locationY?: number }) => Promise<void>
  onDeleteCamera: (cameraId: number | string) => void
  robots: Robot[]
  robotsLoading?: boolean
  robotsError?: string | null
  onRegisterRobot: (payload: { name: string; controlAddress: string; cameraRtspUrl: string; locationX?: number; locationY?: number }) => Promise<void>
  onDeleteRobot: (robotId: number) => void
}

const cameraStatusLabel: Record<Camera['status'], string> = {
  online: 'ONLINE', offline: 'OFFLINE', maintenance: 'MAINTENANCE', alert: 'ALERT',
}

const emptyCameraForm = { name: '', rtspUrl: '', location: '', locationX: '', locationY: '' }
const emptyRobotForm = { name: '', controlAddress: '', cameraRtspUrl: '', locationX: '', locationY: '' }

export function EquipmentManagementPage({
  cameras, camerasLoading, camerasError, onRegisterCamera, onDeleteCamera,
  robots, robotsLoading, robotsError, onRegisterRobot, onDeleteRobot,
}: EquipmentManagementPageProps) {
  const [cameraForm, setCameraForm] = useState(emptyCameraForm)
  const [cameraFormError, setCameraFormError] = useState<string | null>(null)
  const [registeringCamera, setRegisteringCamera] = useState(false)

  const [robotForm, setRobotForm] = useState(emptyRobotForm)
  const [robotFormError, setRobotFormError] = useState<string | null>(null)
  const [registeringRobot, setRegisteringRobot] = useState(false)

  const handleCameraSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setCameraFormError(null)
    setRegisteringCamera(true)
    try {
      await onRegisterCamera({
        name: cameraForm.name,
        rtspUrl: cameraForm.rtspUrl,
        location: cameraForm.location,
        locationX: cameraForm.locationX ? Number(cameraForm.locationX) : undefined,
        locationY: cameraForm.locationY ? Number(cameraForm.locationY) : undefined,
      })
      setCameraForm(emptyCameraForm)
    } catch {
      setCameraFormError('카메라 등록에 실패했습니다.')
    } finally {
      setRegisteringCamera(false)
    }
  }

  const handleRobotSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setRobotFormError(null)
    setRegisteringRobot(true)
    try {
      await onRegisterRobot({
        name: robotForm.name,
        controlAddress: robotForm.controlAddress,
        cameraRtspUrl: robotForm.cameraRtspUrl,
        locationX: robotForm.locationX ? Number(robotForm.locationX) : undefined,
        locationY: robotForm.locationY ? Number(robotForm.locationY) : undefined,
      })
      setRobotForm(emptyRobotForm)
    } catch {
      setRobotFormError('로봇 등록에 실패했습니다.')
    } finally {
      setRegisteringRobot(false)
    }
  }

  return (
    <main className="equipment-management">
      <span className="equipment-management__eyebrow">SAFE-VISION CONTROL CENTER</span>
      <h1>장비 관리</h1>

      <section className="equipment-management__panel">
        <h2>새 카메라 등록</h2>
        <form className="equipment-management__form" onSubmit={handleCameraSubmit}>
          <label><span>이름</span><input value={cameraForm.name} onChange={(event) => setCameraForm({ ...cameraForm, name: event.target.value })} required /></label>
          <label><span>RTSP URL</span><input value={cameraForm.rtspUrl} onChange={(event) => setCameraForm({ ...cameraForm, rtspUrl: event.target.value })} placeholder="rtsp://user:pass@host:554/stream1" required /></label>
          <label><span>위치</span><input value={cameraForm.location} onChange={(event) => setCameraForm({ ...cameraForm, location: event.target.value })} required /></label>
          <label><span>도면 X</span><input type="number" value={cameraForm.locationX} onChange={(event) => setCameraForm({ ...cameraForm, locationX: event.target.value })} placeholder="선택" /></label>
          <label><span>도면 Y</span><input type="number" value={cameraForm.locationY} onChange={(event) => setCameraForm({ ...cameraForm, locationY: event.target.value })} placeholder="선택" /></label>
          <button type="submit" disabled={registeringCamera}>{registeringCamera ? '등록 중...' : '카메라 등록'}</button>
        </form>
        {cameraFormError && <p className="equipment-management__error">{cameraFormError}</p>}
      </section>

      <section className="equipment-management__panel">
        <h2>등록된 카메라 ({cameras.length})</h2>
        {camerasLoading && <p className="equipment-management__hint">불러오는 중...</p>}
        {!camerasLoading && camerasError && <p className="equipment-management__error">{camerasError}</p>}
        {!camerasLoading && !camerasError && cameras.length === 0 && <p className="equipment-management__hint">등록된 카메라가 없습니다.</p>}
        {!camerasLoading && !camerasError && (
          <table className="equipment-management__table">
            <thead><tr><th>ID</th><th>이름</th><th>위치</th><th>RTSP URL</th><th>상태</th><th></th></tr></thead>
            <tbody>
              {cameras.map((camera) => (
                <tr key={camera.id}>
                  <td>CAM-{String(camera.id).padStart(2, '0')}</td>
                  <td>{camera.name}</td>
                  <td>{camera.location ?? '-'}</td>
                  <td className="equipment-management__url">{camera.rtspUrl}</td>
                  <td>{cameraStatusLabel[camera.status]}</td>
                  <td><button type="button" className="equipment-management__delete" onClick={() => onDeleteCamera(camera.id)}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="equipment-management__panel">
        <h2>새 현장 로봇 등록</h2>
        <form className="equipment-management__form" onSubmit={handleRobotSubmit}>
          <label><span>이름</span><input value={robotForm.name} onChange={(event) => setRobotForm({ ...robotForm, name: event.target.value })} required /></label>
          <label><span>제어 주소 (host:port)</span><input value={robotForm.controlAddress} onChange={(event) => setRobotForm({ ...robotForm, controlAddress: event.target.value })} placeholder="192.168.0.50:8081" required /></label>
          <label><span>카메라 RTSP URL</span><input value={robotForm.cameraRtspUrl} onChange={(event) => setRobotForm({ ...robotForm, cameraRtspUrl: event.target.value })} placeholder="rtsp://192.168.0.50:8554/cam" required /></label>
          <label><span>도면 X</span><input type="number" value={robotForm.locationX} onChange={(event) => setRobotForm({ ...robotForm, locationX: event.target.value })} placeholder="선택" /></label>
          <label><span>도면 Y</span><input type="number" value={robotForm.locationY} onChange={(event) => setRobotForm({ ...robotForm, locationY: event.target.value })} placeholder="선택" /></label>
          <button type="submit" disabled={registeringRobot}>{registeringRobot ? '등록 중...' : '로봇 등록'}</button>
        </form>
        {robotFormError && <p className="equipment-management__error">{robotFormError}</p>}
      </section>

      <section className="equipment-management__panel">
        <h2>등록된 현장 로봇 ({robots.length})</h2>
        {robotsLoading && <p className="equipment-management__hint">불러오는 중...</p>}
        {!robotsLoading && robotsError && <p className="equipment-management__error">{robotsError}</p>}
        {!robotsLoading && !robotsError && robots.length === 0 && <p className="equipment-management__hint">등록된 로봇이 없습니다.</p>}
        {!robotsLoading && !robotsError && (
          <table className="equipment-management__table">
            <thead><tr><th>ID</th><th>이름</th><th>제어 주소</th><th>카메라 URL</th><th>상태</th><th></th></tr></thead>
            <tbody>
              {robots.map((robot) => (
                <tr key={robot.id}>
                  <td>ROBOT-{String(robot.id).padStart(2, '0')}</td>
                  <td>{robot.name}</td>
                  <td>{robot.controlAddress}</td>
                  <td className="equipment-management__url">{robot.cameraRtspUrl}</td>
                  <td>{robot.status}</td>
                  <td><button type="button" className="equipment-management__delete" onClick={() => onDeleteRobot(robot.id)}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
