import { useMemo, useState } from 'react'
import type { Camera, SafetyEventRaw } from '../types'
import { mapSafetyEvent } from '../utils/events'
import './RecordingSearchPage.css'

interface RecordingSearchPageProps {
  cameras: Camera[]
  events: SafetyEventRaw[]
  loading?: boolean
  error?: string | null
  onPlayClip: (clipUrl: string) => void
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function RecordingSearchPage({ cameras, events, loading, error, onPlayClip }: RecordingSearchPageProps) {
  const [cameraId, setCameraId] = useState('all')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [startTime, setStartTime] = useState('00:00')
  const [endTime, setEndTime] = useState('23:59')
  const [searched, setSearched] = useState(false)

  const mappedEvents = useMemo(() => events.map((event) => ({ raw: event, view: mapSafetyEvent(event, cameras) })), [events, cameras])

  const visibleResults = useMemo(() => {
    const rangeStart = new Date(`${date}T${startTime}:00`)
    const rangeEnd = new Date(`${date}T${endTime}:59`)
    return mappedEvents.filter(({ raw }) => {
      const cameraMatches = cameraId === 'all' || String(raw.cameraId) === cameraId
      const createdAt = new Date(raw.createdAt)
      return cameraMatches && createdAt >= rangeStart && createdAt <= rangeEnd
    })
  }, [mappedEvents, cameraId, date, startTime, endTime])

  return (
    <main className="recording-page">
      <div className="recording-page__heading">
        <div>
          <span className="page-eyebrow">RECORDING ARCHIVE</span>
          <h1>녹화 검색</h1>
          <p>카메라와 시간 조건으로 이벤트 발생 영상을 검색합니다.</p>
        </div>
        <span className="recording-page__status">ARCHIVE READY</span>
      </div>

      <section className="recording-search-panel">
        <div className="recording-field">
          <label htmlFor="recording-camera">카메라</label>
          <select id="recording-camera" value={cameraId} onChange={(event) => setCameraId(event.target.value)}>
            <option value="all">전체 카메라</option>
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>CAM-{String(camera.id).padStart(2, '0')} {camera.name}</option>
            ))}
          </select>
        </div>
        <div className="recording-field">
          <label htmlFor="recording-date">날짜</label>
          <input id="recording-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
        <div className="recording-field">
          <label htmlFor="recording-start">시작 시간</label>
          <input id="recording-start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
        </div>
        <div className="recording-field">
          <label htmlFor="recording-end">종료 시간</label>
          <input id="recording-end" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
        </div>
        <button type="button" className="recording-search-btn" onClick={() => setSearched(true)}>검색</button>
      </section>

      <section className="recording-results">
        <div className="recording-results__header">
          <h2>{searched ? '검색 결과' : '최근 이벤트 기록'}</h2>
          <span>{visibleResults.length}건</span>
        </div>
        {loading && <p className="recording-page__hint">불러오는 중...</p>}
        {!loading && error && <p className="recording-page__error">{error}</p>}
        {!loading && !error && visibleResults.length === 0 && <p className="recording-page__hint">조건에 맞는 이벤트 영상이 없습니다.</p>}
        {!loading && !error && (
          <div className="recording-list">
            {visibleResults.map(({ raw, view }) => (
              <button
                type="button"
                className="recording-item"
                key={raw.id}
                disabled={!view.clipUrl}
                onClick={() => view.clipUrl && onPlayClip(view.clipUrl)}
              >
                <span className={`recording-item__dot recording-item__dot--${view.severity}`} />
                <span className="recording-item__time">{new Date(raw.createdAt).toLocaleTimeString()}</span>
                <span className="recording-item__camera">CAM-{String(raw.cameraId ?? '-').padStart(2, '0')}</span>
                <span className="recording-item__label">{view.title}</span>
                <span className="recording-item__action">{view.clipUrl ? '재생' : '준비중'}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
