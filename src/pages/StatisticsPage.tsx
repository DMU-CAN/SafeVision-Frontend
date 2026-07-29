import { useMemo, useState } from 'react'
import type { Camera, SafetyEventRaw } from '../types'
import { eventTitle } from '../utils/events'
import './StatisticsPage.css'

interface StatisticsPageProps {
  cameras: Camera[]
  events: SafetyEventRaw[]
  loading?: boolean
  error?: string | null
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const DISTRIBUTION_COLORS = ['var(--danger-red)', '#f59e0b', 'var(--accent-blue)', '#4b5563', '#10b981', '#8b5cf6']

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function StatisticsPage({ cameras, events, loading, error }: StatisticsPageProps) {
  const [periodDays, setPeriodDays] = useState(7)

  const now = useMemo(() => new Date(), [])
  const periodStart = useMemo(() => {
    const date = startOfDay(now)
    date.setDate(date.getDate() - (periodDays - 1))
    return date
  }, [now, periodDays])

  const periodEvents = useMemo(
    () => events.filter((event) => new Date(event.createdAt) >= periodStart),
    [events, periodStart],
  )

  const fallEvents = periodEvents.filter((event) => event.eventType === 'FALL_DETECTED')
  const onlineCameras = cameras.filter((camera) => camera.status === 'online')

  const dailyTrend = useMemo(() => {
    const days: { label: string; date: Date; count: number }[] = []
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = startOfDay(now)
      date.setDate(date.getDate() - offset)
      days.push({ label: DAY_LABELS[date.getDay()], date, count: 0 })
    }
    for (const event of events) {
      const eventDay = startOfDay(new Date(event.createdAt)).getTime()
      const bucket = days.find((day) => day.date.getTime() === eventDay)
      if (bucket) bucket.count += 1
    }
    const max = Math.max(1, ...days.map((day) => day.count))
    return days.map((day) => ({ ...day, heightPercent: Math.max(6, (day.count / max) * 100) }))
  }, [events, now])

  const distribution = useMemo(() => {
    const counts = new Map<string, number>()
    for (const event of periodEvents) {
      counts.set(event.eventType, (counts.get(event.eventType) ?? 0) + 1)
    }
    const entries = [...counts.entries()].sort((a, b) => b[1] - a[1])
    const total = periodEvents.length || 1
    let cumulative = 0
    const slices = entries.map(([eventType, count], index) => {
      const start = (cumulative / total) * 100
      cumulative += count
      const end = (cumulative / total) * 100
      return {
        eventType,
        label: eventTitle(eventType),
        count,
        color: DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length],
        start,
        end,
      }
    })
    const gradient = slices.length === 0
      ? 'var(--btn-bg)'
      : `conic-gradient(${slices.map((slice) => `${slice.color} ${slice.start}% ${slice.end}%`).join(', ')})`
    return { slices, gradient }
  }, [periodEvents])

  const cameraPerformance = useMemo(() => {
    return cameras.map((camera) => {
      const camEvents = periodEvents.filter((event) => event.cameraId === camera.id)
      const latest = camEvents.reduce<SafetyEventRaw | null>((a, b) => (!a || b.createdAt > a.createdAt ? b : a), null)
      return {
        camera,
        eventCount: camEvents.length,
        lastDetected: latest ? new Date(latest.createdAt).toLocaleString() : '-',
      }
    })
  }, [cameras, periodEvents])

  return (
    <main className="statistics-page">
      <div className="statistics-page__heading">
        <div>
          <span className="page-eyebrow">REPORTING & ANALYTICS</span>
          <h1>통계/리포트</h1>
          <p>안전 관제 데이터를 기간별 지표와 리포트로 확인합니다.</p>
        </div>
      </div>

      <section className="statistics-filter">
        <label>조회 기간
          <select value={periodDays} onChange={(event) => setPeriodDays(Number(event.target.value))}>
            <option value={7}>최근 7일</option>
            <option value={30}>최근 30일</option>
            <option value={90}>최근 90일</option>
          </select>
        </label>
        <span>{formatDateInput(periodStart)} — {formatDateInput(now)}</span>
      </section>

      {loading && <p className="statistics-page__hint">불러오는 중...</p>}
      {!loading && error && <p className="statistics-page__error">{error}</p>}

      <section className="statistics-cards">
        <div><span>총 안전 이벤트</span><strong>{periodEvents.length}</strong><small>선택 기간 기준</small></div>
        <div><span>낙상 감지</span><strong className="stat-danger">{fallEvents.length}</strong><small>전체 이벤트의 {periodEvents.length ? Math.round((fallEvents.length / periodEvents.length) * 100) : 0}%</small></div>
        <div><span>등록 카메라</span><strong>{cameras.length}</strong><small>전체 연결 대상 기준</small></div>
        <div><span>온라인 카메라</span><strong className="stat-success">{onlineCameras.length}</strong><small>전체 {cameras.length}대 중</small></div>
      </section>

      <div className="statistics-columns">
        <section className="statistics-panel">
          <div className="statistics-panel__header"><h2>일별 이벤트 추이</h2><span>최근 7일</span></div>
          <div className="bar-chart">
            {dailyTrend.map((day) => (
              <div className="bar-chart__item" key={day.date.toISOString()}>
                <span className="bar-chart__value">{day.count}</span>
                <div className="bar-chart__bar" style={{ height: `${day.heightPercent}%` }} />
                <small>{day.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="statistics-panel">
          <div className="statistics-panel__header"><h2>이벤트 유형 분포</h2><span>총 {periodEvents.length}건</span></div>
          <div className="distribution">
            <div className="distribution__ring" style={{ background: distribution.gradient }} />
            <div className="distribution__legend">
              {distribution.slices.length === 0 && <span>표시할 이벤트가 없습니다.</span>}
              {distribution.slices.map((slice) => (
                <span key={slice.eventType}><i style={{ background: slice.color }} />{slice.label} <b>{slice.count}</b></span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="statistics-panel statistics-report">
        <div className="statistics-panel__header"><h2>카메라별 관제 성과</h2><span>선택 기간 기준</span></div>
        <div className="report-table report-table--head"><span>카메라</span><span>이벤트</span><span>상태</span><span>최근 감지</span></div>
        {cameraPerformance.length === 0 && <p className="statistics-page__hint">등록된 카메라가 없습니다.</p>}
        {cameraPerformance.map(({ camera, eventCount, lastDetected }) => (
          <div className="report-table" key={camera.id}>
            <span>CAM-{String(camera.id).padStart(2, '0')} {camera.name}</span>
            <span>{eventCount}건</span>
            <span className={camera.status === 'online' ? 'stat-success' : 'stat-danger'}>{camera.status.toUpperCase()}</span>
            <span>{lastDetected}</span>
          </div>
        ))}
      </section>
    </main>
  )
}
