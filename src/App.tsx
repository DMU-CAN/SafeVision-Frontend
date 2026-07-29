import { useEffect, useState } from 'react'
import { Header } from './components/layout/Header'
import { CameraSidebar } from './components/layout/CameraSidebar'
import { MonitorGrid } from './components/monitor/MonitorGrid'
import { EventSidebar } from './components/layout/EventSidebar'
import { useClock } from './hooks/useClock'
import { navTabs } from './data/mockData'
import { RecordingSearchPage } from './pages/RecordingSearchPage'
import { AiAnalysisPage } from './pages/AiAnalysisPage'
import { StatisticsPage } from './pages/StatisticsPage'
import './App.css'
import { api } from './api/client'
import type { Camera, SafetyEvent } from './types'
import { ControlPanel } from './components/control/ControlPanel'

function normalizeCameraStatus(status: string): Camera['status'] {
  if (status === 'ONLINE') return 'online'
  if (status === 'OFFLINE') return 'offline'
  if (status === 'MAINTENANCE') return 'maintenance'
  return 'offline'
}

function App() {
  const now = useClock()
  const [activeTab, setActiveTab] = useState(navTabs[0])
  const [cameras, setCameras] = useState<Camera[]>([])
  const [safetyEvents, setSafetyEvents] = useState<SafetyEvent[]>([])

  useEffect(() => {
    api.get<{ items: Camera[] }>('/cameras')
      .then((data) => setCameras(data.items.map((camera) => ({
        ...camera,
        status: normalizeCameraStatus(camera.status),
      }))))
      .catch(() => setCameras([]))
  }, [])

  useEffect(() => {
    api.get<Array<{ id: number; cameraId: number | null; eventType: string; eventLevel: number; createdAt: string }>>('/safety-events')
      .then((events) => setSafetyEvents(events.map((event) => {
        const camera = cameras.find((item) => item.id === event.cameraId)
        const severity = event.eventLevel === 1 ? 'danger' : event.eventLevel === 2 ? 'warning' : 'info'
        const title = event.eventType === 'FALL_DETECTED' ? '낙상 감지' : event.eventType
        return {
          id: String(event.id), severity, title,
          description: `${camera?.name ?? '알 수 없는 카메라'}에서 ${title} 이벤트가 감지되었습니다.`,
          meta: new Date(event.createdAt).toLocaleTimeString(),
          actionLabel: severity === 'danger' ? '확인' : '상세',
        }
      })))
      .catch(() => setSafetyEvents([]))
  }, [cameras])

  const isMonitorPage = activeTab === navTabs[0]
  const isRecordingPage = activeTab === navTabs[1]
  const isAnalysisPage = activeTab === navTabs[2]
  const isStatisticsPage = activeTab === navTabs[3]

  return (
    <div className="app-shell">
      <Header
        activeTab={activeTab}
        now={now}
        operatorName="홍길동 (SYS_ADMIN)"
        onTabChange={setActiveTab}
      />
      {isMonitorPage ? (
        <>
          <div className="app-body">
            <CameraSidebar cameras={cameras} />
            <MonitorGrid cameras={cameras} />
            <EventSidebar events={safetyEvents} />
          </div>
          <ControlPanel cameras={cameras} />
        </>
        
      ) : isRecordingPage ? (
        <RecordingSearchPage />
      ) : isAnalysisPage ? (
        <AiAnalysisPage />
      ) : isStatisticsPage ? (
        <StatisticsPage />
      ) : (
        <main className="page-placeholder">
          <span className="page-placeholder__eyebrow">SAFE-VISION CONTROL CENTER</span>
          <h1>{activeTab}</h1>
          <p>이 페이지는 현재 메뉴 구조에 연결되어 있습니다. 세부 기능을 준비 중입니다.</p>
        </main>
      )}
    </div>
  )
}

export default App
