import { useCallback, useState } from 'react'
import { api } from '../api/client'
import type { Zone, ZonePoint, ZoneType } from '../types'

export function useZones() {
  const [zones, setZones] = useState<Zone[]>([])
  const [zonesLoading, setZonesLoading] = useState(false)
  const [zonesError, setZonesError] = useState<string | null>(null)

  const loadZones = useCallback((cameraId: number | string | null) => {
    setZonesLoading(true)
    setZonesError(null)
    return api.get<Zone[]>(cameraId ? `/zones?cameraId=${cameraId}` : '/zones')
      .then((items) => {
        setZones(items)
        return items
      })
      .catch(() => {
        setZonesError('위험 구역 목록을 불러오지 못했습니다.')
        return []
      })
      .finally(() => setZonesLoading(false))
  }, [])

  const saveZone = useCallback((payload: {
    name: string
    cameraId: number | string
    points: ZonePoint[]
    zoneType: ZoneType
  }) => {
    return api.post('/zones', payload)
      .then(() => loadZones(payload.cameraId))
      .catch(() => setZonesError('위험 구역 저장에 실패했습니다.'))
  }, [loadZones])

  const deleteZone = useCallback((zoneId: number, cameraId: number | string | null) => {
    return api.delete(`/zones/${zoneId}`)
      .then(() => loadZones(cameraId))
      .catch(() => setZonesError('위험 구역 삭제에 실패했습니다.'))
  }, [loadZones])

  return {
    zones,
    zonesLoading,
    zonesError,
    loadZones,
    saveZone,
    deleteZone,
  }
}
