import { useState, type FormEvent } from 'react'
import type { Camera } from '../types'
import './CameraManagementPage.css'

interface CameraManagementPageProps {
  cameras: Camera[]
  loading?: boolean
  error?: string | null
  onRegisterCamera: (payload: { name: string; rtspUrl: string; location: string }) => Promise<void>
  onDeleteCamera: (cameraId: number | string) => void
}

const statusLabel: Record<Camera['status'], string> = {
  online: 'ONLINE', offline: 'OFFLINE', maintenance: 'MAINTENANCE', alert: 'ALERT',
}

export function CameraManagementPage({ cameras, loading, error, onRegisterCamera, onDeleteCamera }: CameraManagementPageProps) {
  const [form, setForm] = useState({ name: '', rtspUrl: '', location: '' })
  const [formError, setFormError] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setRegistering(true)
    try {
      await onRegisterCamera(form)
      setForm({ name: '', rtspUrl: '', location: '' })
    } catch {
      setFormError('카메라 등록에 실패했습니다.')
    } finally {
      setRegistering(false)
    }
  }

  return (
    <main className="camera-management">
      <span className="camera-management__eyebrow">SAFE-VISION CONTROL CENTER</span>
      <h1>카메라 관리</h1>

      <section className="camera-management__panel">
        <h2>새 카메라 등록</h2>
        <form className="camera-management__form" onSubmit={handleSubmit}>
          <label>
            <span>이름</span>
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            <span>RTSP URL</span>
            <input value={form.rtspUrl} onChange={(event) => setForm({ ...form, rtspUrl: event.target.value })} placeholder="rtsp://user:pass@host:554/stream1" required />
          </label>
          <label>
            <span>위치</span>
            <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required />
          </label>
          <button type="submit" disabled={registering}>{registering ? '등록 중...' : '카메라 등록'}</button>
        </form>
        {formError && <p className="camera-management__error">{formError}</p>}
      </section>

      <section className="camera-management__panel">
        <h2>등록된 카메라 ({cameras.length})</h2>
        {loading && <p className="camera-management__hint">불러오는 중...</p>}
        {!loading && error && <p className="camera-management__error">{error}</p>}
        {!loading && !error && cameras.length === 0 && <p className="camera-management__hint">등록된 카메라가 없습니다.</p>}
        {!loading && !error && (
          <table className="camera-management__table">
            <thead>
              <tr><th>ID</th><th>이름</th><th>위치</th><th>RTSP URL</th><th>상태</th><th></th></tr>
            </thead>
            <tbody>
              {cameras.map((camera) => (
                <tr key={camera.id}>
                  <td>CAM-{String(camera.id).padStart(2, '0')}</td>
                  <td>{camera.name}</td>
                  <td>{camera.location ?? '-'}</td>
                  <td className="camera-management__url">{camera.rtspUrl}</td>
                  <td>{statusLabel[camera.status]}</td>
                  <td><button type="button" className="camera-management__delete" onClick={() => onDeleteCamera(camera.id)}>삭제</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}
