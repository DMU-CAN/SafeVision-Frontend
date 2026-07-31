import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { Equipment } from '../../types'
import './ControlPanel.css'

export function ControlPanel() {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    api.get<{ items: Equipment[] }>('/equipments')
      .then((data) => {
        setEquipments(data.items)
        setSelectedId((current) => current ?? data.items[0]?.id ?? null)
      })
      .catch(() => setEquipments([]))
  }, [])

  const selectedEquipment = equipments.find((equipment) => equipment.id === selectedId)

  const control = (action: 'stop' | 'slow' | 'resume') => {
    if (!selectedEquipment) return
    setSending(true)
    setStatus(null)
    api.post<{ sent: boolean }>(`/equipments/${selectedEquipment.id}/${action}`, {})
      .then((result) => setStatus(result.sent ? '명령이 전송됐습니다.' : '설비에 명령이 전달되지 않았습니다.'))
      .catch(() => setStatus('명령 전송에 실패했습니다.'))
      .finally(() => setSending(false))
  }

  return <section className="control-panel">
    <h3>설비 제어</h3>

    {equipments.length === 0 && <p className="control-panel__hint">등록된 설비가 없습니다. 장비 관리에서 먼저 등록하세요.</p>}

    {equipments.length > 0 && (
      <>
        <div className="control-panel__equipment-list">
          {equipments.map((equipment) => (
            <button
              key={equipment.id}
              type="button"
              className={equipment.id === selectedId ? 'control-panel__equipment control-panel__equipment--active' : 'control-panel__equipment'}
              onClick={() => setSelectedId(equipment.id)}
            >
              EQ-{String(equipment.id).padStart(2, '0')} {equipment.name}
            </button>
          ))}
        </div>

        <div className="control-panel__actions">
          <button type="button" className="danger" disabled={sending} onClick={() => control('stop')}>정지</button>
          <button type="button" disabled={sending} onClick={() => control('slow')}>감속</button>
          <button type="button" disabled={sending} onClick={() => control('resume')}>재가동</button>
        </div>
        {status && <p className="control-panel__status">{status}</p>}
      </>
    )}
  </section>
}
