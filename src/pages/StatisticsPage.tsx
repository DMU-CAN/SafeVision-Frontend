import './StatisticsPage.css'

const bars = [
  { day: '월', value: 42 }, { day: '화', value: 58 }, { day: '수', value: 36 }, { day: '목', value: 74 }, { day: '금', value: 51 }, { day: '토', value: 29 }, { day: '일', value: 44 },
]

export function StatisticsPage() {
  return (
    <main className="statistics-page">
      <div className="statistics-page__heading"><div><span className="page-eyebrow">REPORTING & ANALYTICS</span><h1>통계/리포트</h1><p>안전 관제 데이터를 기간별 지표와 리포트로 확인합니다.</p></div><button type="button" className="report-btn">리포트 내보내기</button></div>
      <section className="statistics-filter"><label>조회 기간 <select defaultValue="7"><option value="7">최근 7일</option><option value="30">최근 30일</option><option value="90">최근 90일</option></select></label><span>2026.07.23 — 2026.07.29</span></section>
      <section className="statistics-cards"><div><span>총 안전 이벤트</span><strong>216</strong><small>지난 기간 대비 +8.4%</small></div><div><span>낙상 감지</span><strong className="stat-danger">48</strong><small>전체 이벤트의 22.2%</small></div><div><span>평균 대응 시간</span><strong>02:14</strong><small>지난 기간 대비 -12초</small></div><div><span>카메라 가동률</span><strong className="stat-success">98.6%</strong><small>정상 34 / 점검 2</small></div></section>
      <div className="statistics-columns"><section className="statistics-panel"><div className="statistics-panel__header"><h2>일별 이벤트 추이</h2><span>이벤트 수</span></div><div className="bar-chart">{bars.map((bar) => <div className="bar-chart__item" key={bar.day}><span className="bar-chart__value">{bar.value}</span><div className="bar-chart__bar" style={{ height: `${bar.value}%` }} /><small>{bar.day}</small></div>)}</div></section><section className="statistics-panel"><div className="statistics-panel__header"><h2>이벤트 유형 분포</h2><span>총 216건</span></div><div className="distribution"><div className="distribution__ring" /><div className="distribution__legend"><span><i className="legend--danger" />낙상 감지 <b>48</b></span><span><i className="legend--warning" />침입·배회 <b>72</b></span><span><i className="legend--blue" />차량·출입 <b>61</b></span><span><i className="legend--muted" />기타 감지 <b>35</b></span></div></div></section></div>
      <section className="statistics-panel statistics-report"><div className="statistics-panel__header"><h2>카메라별 관제 성과</h2><span>최근 7일</span></div><div className="report-table report-table--head"><span>카메라</span><span>이벤트</span><span>가동률</span><span>평균 대응</span></div>{['CAM-01 메인 로비','CAM-02 동측 주차장','CAM-03 N-1 작업 구역','CAM-04 B1 주차장'].map((camera, index) => <div className="report-table" key={camera}><span>{camera}</span><span>{[31, 46, 68, 22][index]}건</span><span className="stat-success">{[99.8, 98.2, 97.1, 99.4][index]}%</span><span>0{index + 1}:4{index}</span></div>)}</section>
    </main>
  )
}
