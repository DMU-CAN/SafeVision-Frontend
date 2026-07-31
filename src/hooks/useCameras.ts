import { useCallback, useState } from 'react'
import { api } from '../api/client'
import type { Camera } from '../types'

function normalizeCameraStatus(status: string): Camera['status'] {
  if (status === 'ONLINE') return 'online'
  if (status === 'OFFLINE') return 'offline'
  if (status === 'MAINTENANCE') return 'maintenance'
  return 'offline'
}

export function useCameras() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [camerasLoading, setCamerasLoading] = useState(true)
  const [camerasError, setCamerasError] = useState<string | null>(null)

  const loadCameras = useCallback(() => {
    setCamerasLoading(true)
    setCamerasError(null)
    return api.get<{ items: Camera[] }>('/cameras')
      .then((data) => {
        const normalized = data.items.map((camera) => ({
          ...camera,
          status: normalizeCameraStatus(camera.status),
        }))
        setCameras(normalized)
        return normalized
      })
      .catch(() => {
        setCamerasError('카메라 목록을 불러오지 못했습니다.')
        return []
      })
      .finally(() => setCamerasLoading(false))
  }, [])

  const registerCamera = useCallback(async (payload: {
    name: string
    rtspUrl: string
    location: string
    locationX?: number
    locationY?: number
  }) => {
    await api.post('/cameras', payload)
    await loadCameras()
  }, [loadCameras])

  const deleteCamera = useCallback((cameraId: number | string) => {
    return api.delete(`/cameras/${cameraId}`)
      .then(() => loadCameras())
      .catch(() => setCamerasError('카메라 삭제에 실패했습니다.'))
  }, [loadCameras])

  return {
    cameras,
    camerasLoading,
    camerasError,
    setCamerasError,
    loadCameras,
    registerCamera,
    deleteCamera,
  }
}
