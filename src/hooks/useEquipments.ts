import { useCallback, useState } from 'react'
import { api } from '../api/client'
import type { ControlProtocol, Equipment } from '../types'

export function useEquipments() {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [equipmentsLoading, setEquipmentsLoading] = useState(true)
  const [equipmentsError, setEquipmentsError] = useState<string | null>(null)

  const loadEquipments = useCallback(() => {
    setEquipmentsLoading(true)
    setEquipmentsError(null)
    return api.get<{ items: Equipment[] }>('/equipments')
      .then((data) => {
        setEquipments(data.items)
        return data.items
      })
      .catch(() => {
        setEquipmentsError('설비 목록을 불러오지 못했습니다.')
        return []
      })
      .finally(() => setEquipmentsLoading(false))
  }, [])

  const registerEquipment = useCallback(async (payload: {
    name: string
    controlProtocol: ControlProtocol
    controlAddress: string
  }) => {
    await api.post('/equipments', payload)
    await loadEquipments()
  }, [loadEquipments])

  const deleteEquipment = useCallback((equipmentId: number) => {
    return api.delete(`/equipments/${equipmentId}`)
      .then(() => loadEquipments())
      .catch(() => setEquipmentsError('설비 삭제에 실패했습니다.'))
  }, [loadEquipments])

  return {
    equipments,
    equipmentsLoading,
    equipmentsError,
    loadEquipments,
    registerEquipment,
    deleteEquipment,
  }
}
