import { useCallback, useEffect, useState } from 'react'
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
import type { Camera, SafetyEvent, Zone, ZonePoint } from './types'
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
  const [zones, setZones] = useState<Zone[]>([])
  const [zonesLoading, setZonesLoading] = useState(false)
  const [zonesError, setZonesError] = useState<string | null>(null)
  const [zoneEditing, setZoneEditing] = useState(false)
  const [zoneDraftPoints, setZoneDraftPoints] = useState<ZonePoint[]>([])

  const loadCameras = useCallback(() => {
    setCamerasLoading(true)
    setCamerasError(null)
    return api.get<{ items: Camera[] }>('/cameras')
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
  }, [])

  const loadZones = useCallback((cameraId: number | string | null) => {
    setZonesLoading(true)
    setZonesError(null)
    return api.get<Zone[]>(cameraId ? `/zones?cameraId=${cameraId}` : '/zones')
      .then(setZones)
      .catch(() => setZonesError('위험 구역 목록을 불러오지 못했습니다.'))
      .finally(() => setZonesLoading(false))
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => setAuthed(false)
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  useEffect(() => {
    if (!authed) return
    loadCameras()
  }, [authed, loadCameras])

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

  useEffect(() => {
    if (!authed) return
    setZoneEditing(false)
    setZoneDraftPoints([])
    loadZones(selectedCameraId)
  }, [authed, selectedCameraId, loadZones])

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />
  }

  const user = getStoredUser()
  const handleLogout = () => { api.logout().finally(() => setAuthed(false)) }

  const handleRegisterCamera = async (payload: { name: string; rtspUrl: string; location: string }) => {
    await api.post('/cameras', payload)
    await loadCameras()
  }

  const handleSaveZone = (name: string) => {
    if (!selectedCameraId || zoneDraftPoints.length < 3) return
    api.post('/zones', { name, cameraId: selectedCameraId, points: zoneDraftPoints })
      .then(() => {
        setZoneEditing(false)
        setZoneDraftPoints([])
        return loadZones(selectedCameraId)
      })
      .catch(() => setZonesError('위험 구역 저장에 실패했습니다.'))
  }

  const handleDeleteZone = (zoneId: number) => {
    api.delete(`/zones/${zoneId}`)
      .then(() => loadZones(selectedCameraId))
      .catch(() => setZonesError('위험 구역 삭제에 실패했습니다.'))
  }

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
            <MonitorGrid
              cameras={cameras}
              selectedCameraId={selectedCameraId}
              zones={zones}
              zoneEditing={zoneEditing}
              zoneDraftPoints={zoneDraftPoints}
              onZonePointAdd={(point) => setZoneDraftPoints((current) => [...current, point])}
            />
            <EventSidebar events={safetyEvents} loading={eventsLoading} error={eventsError} />
          </div>
          <ControlPanel
            cameras={cameras}
            selectedCameraId={selectedCameraId}
            zones={zones}
            zonesLoading={zonesLoading}
            zonesError={zonesError}
            zoneEditing={zoneEditing}
            zoneDraftPoints={zoneDraftPoints}
            onStartZoneEditing={() => { setZoneEditing(true); setZoneDraftPoints([]) }}
            onUndoZonePoint={() => setZoneDraftPoints((current) => current.slice(0, -1))}
            onCancelZoneEditing={() => { setZoneEditing(false); setZoneDraftPoints([]) }}
            onSaveZone={handleSaveZone}
            onDeleteZone={handleDeleteZone}
            onRegisterCamera={handleRegisterCamera}
          />
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
