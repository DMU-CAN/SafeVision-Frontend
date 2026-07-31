import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import type { SafetyEventRaw } from '../types'

const EVENTS_POLL_INTERVAL_MS = 8000

export function useSafetyEvents(enabled: boolean) {
  const [safetyEvents, setSafetyEvents] = useState<SafetyEventRaw[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)

  const loadEvents = useCallback((showLoading: boolean) => {
    if (showLoading) setEventsLoading(true)
    setEventsError(null)
    return api.get<SafetyEventRaw[]>('/safety-events?limit=200')
      .then((events) => {
        setSafetyEvents(events)
        return events
      })
      .catch(() => {
        setEventsError('이벤트 목록을 불러오지 못했습니다.')
        return []
      })
      .finally(() => setEventsLoading(false))
  }, [])

  useEffect(() => {
    if (!enabled) return
    loadEvents(true)
    const interval = setInterval(() => loadEvents(false), EVENTS_POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [enabled, loadEvents])

  return {
    safetyEvents,
    eventsLoading,
    eventsError,
    loadEvents,
  }
}
