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
import { LoginPage } from './pages/LoginPage'
import './App.css'
import { api, getStoredUser, isAuthenticated, UNAUTHORIZED_EVENT } from './api/client'
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
  const [authed, setAuthed] = useState(isAuthenticated)
  const [activeTab, setActiveTab] = useState(navTabs[0])
  const [cameras, setCameras] = useState<Camera[]>([])
  const [camerasLoading, setCamerasLoading] = useState(true)
  const [camerasError, setCamerasError] = useState<string | null>(null)
  const [safetyEvents, setSafetyEvents] = useState<SafetyEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [selectedCameraId, setSelectedCameraId] = useState<number | string | null>(null)

  useEffect(() => {
    const handleUnauthorized = () => setAuthed(false)
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  useEffect(() => {
    if (!authed) return
    setCamerasLoading(true)
    setCamerasError(null)
    api.get<{ items: Camera[] }>('/cameras')
      .then((data) => {
        const normalized = data.items.map((camera) => ({
          ...camera,
          status: normalizeCameraStatus(camera.status),
        }))
        setCameras(normalized)
        setSelectedCameraId((current) => current ?? normalized[0]?.id ?? null)
      })
      .catch(() => setCamerasError('카메라 목록을 불러오지 못했습니다.'))
      .finally(() => setCamerasLoading(false))
  }, [authed])

  useEffect(() => {
    if (!authed) return
    setEventsLoading(true)
    setEventsError(null)
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
      .catch(() => setEventsError('이벤트 목록을 불러오지 못했습니다.'))
      .finally(() => setEventsLoading(false))
  }, [authed, cameras])

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />
  }

  const user = getStoredUser()
  const handleLogout = () => { api.logout().finally(() => setAuthed(false)) }

  const isMonitorPage = activeTab === navTabs[0]
  const isRecordingPage = activeTab === navTabs[1]
  const isAnalysisPage = activeTab === navTabs[2]
  const isStatisticsPage = activeTab === navTabs[3]

  return (
    <div className="app-shell">
      <Header
        activeTab={activeTab}
        now={now}
        operatorName={user ? `${user.name} (${user.role})` : '알 수 없음'}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
      {isMonitorPage ? (
        <>
          <div className="app-body">
            <CameraSidebar
              cameras={cameras}
              loading={camerasLoading}
              error={camerasError}
              selectedCameraId={selectedCameraId}
              onSelectCamera={setSelectedCameraId}
            />
            <MonitorGrid cameras={cameras} selectedCameraId={selectedCameraId} />
            <EventSidebar events={safetyEvents} loading={eventsLoading} error={eventsError} />
          </div>
          <ControlPanel cameras={cameras} selectedCameraId={selectedCameraId} />
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
