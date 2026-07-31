import { useCallback, useState } from 'react'
import { api } from '../api/client'
import type { Robot } from '../types'

export function useRobots() {
  const [robots, setRobots] = useState<Robot[]>([])
  const [robotsLoading, setRobotsLoading] = useState(true)
  const [robotsError, setRobotsError] = useState<string | null>(null)

  const loadRobots = useCallback(() => {
    setRobotsLoading(true)
    setRobotsError(null)
    return api.get<{ items: Robot[] }>('/robots')
      .then((data) => {
        setRobots(data.items)
        return data.items
      })
      .catch(() => {
        setRobotsError('로봇 목록을 불러오지 못했습니다.')
        return []
      })
      .finally(() => setRobotsLoading(false))
  }, [])

  const registerRobot = useCallback(async (payload: {
    name: string
    controlAddress: string
    cameraRtspUrl: string
    locationX?: number
    locationY?: number
  }) => {
    await api.post('/robots', payload)
    await loadRobots()
  }, [loadRobots])

  const deleteRobot = useCallback((robotId: number) => {
    return api.delete(`/robots/${robotId}`)
      .then(() => loadRobots())
      .catch(() => setRobotsError('로봇 삭제에 실패했습니다.'))
  }, [loadRobots])

  return {
    robots,
    robotsLoading,
    robotsError,
    setRobotsError,
    loadRobots,
    registerRobot,
    deleteRobot,
  }
}
