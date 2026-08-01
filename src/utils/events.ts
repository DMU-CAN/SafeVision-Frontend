import { API_BASE_URL, withAccessToken } from '../api/client'
import type { Camera, EventSeverity, SafetyEvent, SafetyEventRaw } from '../types'

export function eventSeverity(eventLevel: number): EventSeverity {
  if (eventLevel === 1) return 'danger'
  if (eventLevel === 2) return 'warning'
  return 'info'
}

export function eventTitle(eventType: string): string {
  if (eventType === 'FALL_DETECTED') return '낙상 감지'
  if (eventType === 'ZONE_INTRUSION') return '위험구역 접근'
  if (eventType === 'CAMERA_ANGLE_CHANGED') return '카메라 각도 변경'
  return eventType
}

export function mapSafetyEvent(event: SafetyEventRaw, cameras: Camera[]): SafetyEvent {
  const camera = cameras.find((item) => item.id === event.cameraId)
  const severity = eventSeverity(event.eventLevel)
  const title = eventTitle(event.eventType)
  const detectedAt = new Date(event.createdAt)
  return {
    id: String(event.id),
    severity,
    title,
    description: `${camera?.name ?? '알 수 없는 카메라'}에서 ${title} 이벤트가 감지되었습니다.`,
    meta: detectedAt.toLocaleString(),
    actionLabel: severity === 'danger' ? '확인' : '상세',
    clipUrl: event.clipPath ? withAccessToken(`${API_BASE_URL}/safety-events/${event.id}/clip`) : undefined,
  }
}
