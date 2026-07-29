import { useMemo, useState } from 'react'
import { safetyEvents } from '../data/mockData'
import './AiAnalysisPage.css'

const analysisRows = [
  { camera: 'CAM-03', location: 'N-1 작업 구역', detections: 18, risk: '높음', lastDetected: '10:46:12' },
  { camera: 'CAM-02', location: '동측 주차장 입구', detections: 11, risk: '주의', lastDetected: '10:42:05' },
  { camera: 'CAM-01', location: '메인 로비', detections: 6, risk: '낮음', lastDetected: '10:38:19' },
  { camera: 'CAM-08', location: '서측 외장 작업장', detections: 4, risk: '주의', lastDetected: '10:15:40' },
]

export function AiAnalysisPage() {
  const [severity, setSeverity] = useState('all')
  const filteredEvents = useMemo(
    () => severity === 'all' ? safetyEvents : safetyEvents.filter((event) => event.severity === severity),
    [severity],
  )

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

      <section className="analysis-summary">
        <div><span>오늘 감지 이벤트</span><strong>39</strong><small>지난 시간 대비 +12%</small></div>
        <div><span>고위험 이벤트</span><strong className="analysis-number--danger">8</strong><small>즉시 확인 필요</small></div>
        <div><span>분석 카메라</span><strong>6</strong><small>전체 연결 대상 기준</small></div>
        <div><span>평균 신뢰도</span><strong>94.2%</strong><small>최근 24시간</small></div>
      </section>

      <div className="analysis-columns">
        <section className="analysis-panel">
          <div className="analysis-panel__header"><h2>카메라별 AI 감지 현황</h2><span>최근 24시간</span></div>
          <div className="analysis-table analysis-table--head"><span>카메라</span><span>감지 건수</span><span>위험도</span><span>최근 감지</span></div>
          {analysisRows.map((row) => (
            <div className="analysis-table" key={row.camera}>
              <span><b>{row.camera}</b><small>{row.location}</small></span>
              <span>{row.detections}건</span>
              <span className={`risk risk--${row.risk === '높음' ? 'high' : row.risk === '주의' ? 'medium' : 'low'}`}>{row.risk}</span>
              <span>{row.lastDetected}</span>
            </div>
          ))}
        </section>

        <section className="analysis-panel">
          <div className="analysis-panel__header"><h2>최근 AI 이벤트</h2>
            <select value={severity} onChange={(event) => setSeverity(event.target.value)} aria-label="이벤트 위험도 필터">
              <option value="all">전체 위험도</option><option value="danger">위험</option><option value="warning">주의</option><option value="info">정보</option>
            </select>
          </div>
          <div className="analysis-event-list">
            {filteredEvents.map((event) => <div className="analysis-event" key={event.id}><span className={`analysis-event__dot analysis-event__dot--${event.severity}`} /><div><b>{event.title}</b><small>{event.description}</small></div><time>{event.meta.split(' | ')[0]}</time></div>)}
          </div>
        </section>
      </div>
    </main>
  )
}
