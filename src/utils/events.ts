import type { Camera, EventSeverity, SafetyEvent, SafetyEventRaw } from '../types'

export function eventSeverity(eventLevel: number): EventSeverity {
  if (eventLevel === 1) return 'danger'
  if (eventLevel === 2) return 'warning'
  return 'info'
}

export function eventTitle(eventType: string): string {
  if (eventType === 'FALL_DETECTED') return '낙상 감지'
  return eventType
}

export function mapSafetyEvent(event: SafetyEventRaw, cameras: Camera[]): SafetyEvent {
  const camera = cameras.find((item) => item.id === event.cameraId)
  const severity = eventSeverity(event.eventLevel)
  const title = eventTitle(event.eventType)
  return {
    id: String(event.id),
    severity,
    title,
    description: `${camera?.name ?? '알 수 없는 카메라'}에서 ${title} 이벤트가 감지되었습니다.`,
    meta: new Date(event.createdAt).toLocaleTimeString(),
    actionLabel: severity === 'danger' ? '확인' : '상세',
  }
}
