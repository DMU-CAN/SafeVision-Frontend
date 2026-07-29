import { useState } from 'react'
import { cameraBoxes } from '../data/mockData'
import './RecordingSearchPage.css'

const searchResults = [
  { time: '10:46:12', camera: 'CAM-03', label: '낙상 감지 이벤트', severity: 'danger' },
  { time: '10:42:05', camera: 'CAM-02', label: '차량 진입 감지', severity: 'warning' },
  { time: '10:38:19', camera: 'CAM-01', label: '작업자 출입 확인', severity: 'info' },
]

export function RecordingSearchPage() {
  const [cameraId, setCameraId] = useState('all')
  const [eventOnly, setEventOnly] = useState(false)
  const [searched, setSearched] = useState(false)

  const visibleResults = searchResults.filter((result) => {
    const cameraMatches = cameraId === 'all' || result.camera === cameraId
    return cameraMatches && (!eventOnly || result.severity !== 'info')
  })

  return (
    <main className="recording-page">
      <div className="recording-page__heading">
        <div>
          <span className="page-eyebrow">RECORDING ARCHIVE</span>
          <h1>녹화 검색</h1>
          <p>카메라와 시간 조건으로 과거 녹화 영상을 검색합니다.</p>
        </div>
        <span className="recording-page__status">ARCHIVE READY</span>
      </div>

      <section className="recording-search-panel">
        <div className="recording-field">
          <label htmlFor="recording-camera">카메라</label>
          <select id="recording-camera" value={cameraId} onChange={(event) => setCameraId(event.target.value)}>
            <option value="all">전체 카메라</option>
            {cameraBoxes.map((camera) => (
              <option key={camera.id} value={camera.id}>{camera.label}</option>
            ))}
          </select>
        </div>
        <div className="recording-field">
          <label htmlFor="recording-date">날짜</label>
          <input id="recording-date" type="date" defaultValue="2026-07-29" />
        </div>
        <div className="recording-field">
          <label htmlFor="recording-start">시작 시간</label>
          <input id="recording-start" type="time" defaultValue="10:00" />
        </div>
        <div className="recording-field">
          <label htmlFor="recording-end">종료 시간</label>
          <input id="recording-end" type="time" defaultValue="11:00" />
        </div>
        <label className="recording-check">
          <input type="checkbox" checked={eventOnly} onChange={(event) => setEventOnly(event.target.checked)} />
          이벤트만 보기
        </label>
        <button type="button" className="recording-search-btn" onClick={() => setSearched(true)}>검색</button>
      </section>

      <section className="recording-results">
        <div className="recording-results__header">
          <h2>{searched ? '검색 결과' : '최근 이벤트 기록'}</h2>
          <span>{visibleResults.length}건</span>
        </div>
        <div className="recording-timeline">
          <div className="recording-timeline__track"><span className="recording-timeline__marker" /></div>
          <div className="recording-timeline__scale"><span>10:00</span><span>10:15</span><span>10:30</span><span>10:45</span><span>11:00</span></div>
        </div>
        <div className="recording-list">
          {visibleResults.map((result) => (
            <button type="button" className="recording-item" key={`${result.camera}-${result.time}`}>
              <span className={`recording-item__dot recording-item__dot--${result.severity}`} />
              <span className="recording-item__time">{result.time}</span>
              <span className="recording-item__camera">{result.camera}</span>
              <span className="recording-item__label">{result.label}</span>
              <span className="recording-item__action">재생</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
