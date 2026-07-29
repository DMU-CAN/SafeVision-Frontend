import { useMemo, useState } from 'react'
import type { Camera, EventSeverity, SafetyEventRaw } from '../types'
import { eventSeverity, mapSafetyEvent } from '../utils/events'
import './AiAnalysisPage.css'

interface AiAnalysisPageProps {
  cameras: Camera[]
  events: SafetyEventRaw[]
  loading?: boolean
  error?: string | null
}

interface CameraDetectionRow {
  cameraId: number | string
  camera: string
  location: string
  detections: number
  risk: '높음' | '주의' | '낮음'
  lastDetected: string
}

function riskFromCount(count: number): CameraDetectionRow['risk'] {
  if (count >= 10) return '높음'
  if (count >= 5) return '주의'
  return '낮음'
}

function isToday(dateString: string): boolean {
  const date = new Date(dateString)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()
}

export function AiAnalysisPage({ cameras, events, loading, error }: AiAnalysisPageProps) {
  const [severity, setSeverity] = useState<'all' | EventSeverity>('all')

  const mappedEvents = useMemo(() => events.map((event) => mapSafetyEvent(event, cameras)), [events, cameras])
  const filteredEvents = useMemo(
    () => severity === 'all' ? mappedEvents : mappedEvents.filter((event) => event.severity === severity),
    [severity, mappedEvents],
  )

  const analysisRows = useMemo<CameraDetectionRow[]>(() => {
    const byCameraId = new Map<number, SafetyEventRaw[]>()
    for (const event of events) {
      if (event.cameraId === null) continue
      const list = byCameraId.get(event.cameraId) ?? []
      list.push(event)
      byCameraId.set(event.cameraId, list)
    }
    return [...byCameraId.entries()]
      .map(([cameraId, camEvents]) => {
        const camera = cameras.find((item) => item.id === cameraId)
        const latest = camEvents.reduce((a, b) => (a.createdAt > b.createdAt ? a : b))
        return {
          cameraId,
          camera: camera ? `CAM-${String(camera.id).padStart(2, '0')}` : `CAM-${String(cameraId).padStart(2, '0')}`,
          location: camera?.location ?? '알 수 없음',
          detections: camEvents.length,
          risk: riskFromCount(camEvents.length),
          lastDetected: new Date(latest.createdAt).toLocaleTimeString(),
        }
      })
      .sort((a, b) => b.detections - a.detections)
  }, [events, cameras])

  const todayEvents = useMemo(() => events.filter((event) => isToday(event.createdAt)), [events])
  const dangerEvents = events.filter((event) => eventSeverity(event.eventLevel) === 'danger')
  const onlineCameras = cameras.filter((camera) => camera.status === 'online')

  return (
    <main className="analysis-page">
      <div className="analysis-page__heading">
        <div>
          <span className="page-eyebrow">AI INTELLIGENCE</span>
          <h1>AI 지능형 분석</h1>
          <p>AI 감지 결과와 위험도를 카메라별로 분석합니다.</p>
        </div>
        <span className="analysis-page__model">YOLO POSE · ACTIVE</span>
      </div>

      {loading && <p className="analysis-page__hint">불러오는 중...</p>}
      {!loading && error && <p className="analysis-page__error">{error}</p>}

      <section className="analysis-summary">
        <div><span>오늘 감지 이벤트</span><strong>{todayEvents.length}</strong><small>전체 {events.length}건 중</small></div>
        <div><span>고위험 이벤트</span><strong className="analysis-number--danger">{dangerEvents.length}</strong><small>즉시 확인 필요</small></div>
        <div><span>분석 카메라</span><strong>{cameras.length}</strong><small>전체 연결 대상 기준</small></div>
        <div><span>온라인 카메라</span><strong>{onlineCameras.length}</strong><small>전체 {cameras.length}대 중</small></div>
      </section>

      <div className="analysis-columns">
        <section className="analysis-panel">
          <div className="analysis-panel__header"><h2>카메라별 AI 감지 현황</h2><span>전체 기간</span></div>
          <div className="analysis-table analysis-table--head"><span>카메라</span><span>감지 건수</span><span>위험도</span><span>최근 감지</span></div>
          {analysisRows.length === 0 && <p className="analysis-page__hint">감지 이력이 없습니다.</p>}
          {analysisRows.map((row) => (
            <div className="analysis-table" key={row.cameraId}>
              <span><b>{row.camera}</b><small>{row.location}</small></span>
              <span>{row.detections}건</span>
              <span className={`risk risk--${row.risk === '높음' ? 'high' : row.risk === '주의' ? 'medium' : 'low'}`}>{row.risk}</span>
              <span>{row.lastDetected}</span>
            </div>
          ))}
        </section>

        <section className="analysis-panel">
          <div className="analysis-panel__header"><h2>최근 AI 이벤트</h2>
            <select value={severity} onChange={(event) => setSeverity(event.target.value as 'all' | EventSeverity)} aria-label="이벤트 위험도 필터">
              <option value="all">전체 위험도</option><option value="danger">위험</option><option value="warning">주의</option><option value="info">정보</option>
            </select>
          </div>
          <div className="analysis-event-list">
            {filteredEvents.length === 0 && <p className="analysis-page__hint">해당하는 이벤트가 없습니다.</p>}
            {filteredEvents.map((event) => <div className="analysis-event" key={event.id}><span className={`analysis-event__dot analysis-event__dot--${event.severity}`} /><div><b>{event.title}</b><small>{event.description}</small></div><time>{event.meta}</time></div>)}
          </div>
        </section>
      </div>
    </main>
  )
}
