import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Camera } from '../../types'
import './ControlPanel.css'

interface Zone { id: number; name: string; cameraId: number | null; points: { x: number; y: number }[] }

export function ControlPanel({ cameras }: { cameras: Camera[] }) {
  const [zones, setZones] = useState<Zone[]>([])
  const [name, setName] = useState('위험 구역')
  const cameraId = cameras[0]?.id

  const loadZones = () => api.get<Zone[]>(cameraId ? `/zones?cameraId=${cameraId}` : '/zones').then(setZones).catch(() => setZones([]))
  useEffect(() => { loadZones() }, [cameraId])

  const createZone = async () => {
    if (!cameraId) return
    await api.post('/zones', { name, cameraId, points: [{ x: 100, y: 100 }, { x: 900, y: 100 }, { x: 900, y: 500 }, { x: 100, y: 500 }] })
    await loadZones()
  }

  const control = (action: 'stop' | 'slow' | 'resume') => api.post(`/equipment/${action}`, {}).catch(() => undefined)

  return <section className="control-panel">
    <div className="control-panel__section"><h3>위험 구역</h3><div className="control-panel__form"><input value={name} onChange={(event) => setName(event.target.value)} /><button type="button" onClick={createZone}>구역 등록</button></div>
      {zones.map((zone) => <div className="control-panel__row" key={zone.id}><span>{zone.name}</span><button type="button" onClick={() => api.delete(`/zones/${zone.id}`).then(loadZones)}>삭제</button></div>)}
    </div>
    <div className="control-panel__section"><h3>설비 제어</h3><div className="control-panel__actions"><button type="button" className="danger" onClick={() => control('stop')}>정지</button><button type="button" onClick={() => control('slow')}>감속</button><button type="button" onClick={() => control('resume')}>재가동</button></div></div>
  </section>
}
