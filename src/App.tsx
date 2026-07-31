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
import { EquipmentManagementPage } from './pages/EquipmentManagementPage'
import { ZoneSettingsPage } from './pages/ZoneSettingsPage'
import { FieldRobotPage } from './pages/FieldRobotPage'
import './App.css'
import { api, getStoredUser, isAuthenticated, UNAUTHORIZED_EVENT } from './api/client'
import type { Camera, ControlProtocol, Equipment, Robot, SafetyEventRaw, Zone, ZonePoint } from './types'
import { ControlPanel } from './components/control/ControlPanel'
import { closeAllConnections, closeConnection } from './hooks/webrtcManager'
import { mapSafetyEvent } from './utils/events'
import { ClipModal } from './components/common/ClipModal'

const EVENTS_POLL_INTERVAL_MS = 8000

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
  const [robots, setRobots] = useState<Robot[]>([])
  const [robotsLoading, setRobotsLoading] = useState(true)
  const [robotsError, setRobotsError] = useState<string | null>(null)
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [equipmentsLoading, setEquipmentsLoading] = useState(true)
  const [equipmentsError, setEquipmentsError] = useState<string | null>(null)
  const [safetyEvents, setSafetyEvents] = useState<SafetyEventRaw[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [selectedCameraId, setSelectedCameraId] = useState<number | string | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [zonesLoading, setZonesLoading] = useState(false)
  const [zonesError, setZonesError] = useState<string | null>(null)
  const [zoneEditing, setZoneEditing] = useState(false)
  const [zoneDraftPoints, setZoneDraftPoints] = useState<ZonePoint[]>([])
  const [activeClipUrl, setActiveClipUrl] = useState<string | null>(null)

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

  const loadRobots = useCallback(() => {
    setRobotsLoading(true)
    setRobotsError(null)
    return api.get<{ items: Robot[] }>('/robots')
      .then((data) => setRobots(data.items))
      .catch(() => setRobotsError('로봇 목록을 불러오지 못했습니다.'))
      .finally(() => setRobotsLoading(false))
  }, [])

  const loadEquipments = useCallback(() => {
    setEquipmentsLoading(true)
    setEquipmentsError(null)
    return api.get<{ items: Equipment[] }>('/equipments')
      .then((data) => setEquipments(data.items))
      .catch(() => setEquipmentsError('설비 목록을 불러오지 못했습니다.'))
      .finally(() => setEquipmentsLoading(false))
  }, [])

  const loadEvents = useCallback((showLoading: boolean) => {
    if (showLoading) setEventsLoading(true)
    setEventsError(null)
    return api.get<SafetyEventRaw[]>('/safety-events?limit=200')
      .then(setSafetyEvents)
      .catch(() => setEventsError('이벤트 목록을 불러오지 못했습니다.'))
      .finally(() => setEventsLoading(false))
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
    loadRobots()
    loadEquipments()
  }, [authed, loadCameras, loadRobots, loadEquipments])

  useEffect(() => {
    if (!authed) return
    loadEvents(true)
    const interval = setInterval(() => loadEvents(false), EVENTS_POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [authed, loadEvents])

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
  const handleLogout = () => { closeAllConnections(); api.logout().finally(() => setAuthed(false)) }

  const handleRegisterCamera = async (payload: { name: string; rtspUrl: string; location: string; locationX?: number; locationY?: number }) => {
    await api.post('/cameras', payload)
    await loadCameras()
  }

  const handleRegisterRobot = async (payload: { name: string; controlAddress: string; cameraRtspUrl: string; locationX?: number; locationY?: number }) => {
    await api.post('/robots', payload)
    await loadRobots()
  }

  const handleRegisterEquipment = async (payload: { name: string; controlProtocol: ControlProtocol; controlAddress: string }) => {
    await api.post('/equipments', payload)
    await loadEquipments()
  }

  const handleDeleteEquipment = (equipmentId: number) => {
    api.delete(`/equipments/${equipmentId}`)
      .then(() => loadEquipments())
      .catch(() => setEquipmentsError('설비 삭제에 실패했습니다.'))
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

  const handleDeleteCamera = (cameraId: number | string) => {
    api.delete(`/cameras/${cameraId}`)
      .then(() => {
        if (typeof cameraId === 'number') closeConnection({ kind: 'camera', cameraId })
        return loadCameras()
      })
      .catch(() => setCamerasError('카메라 삭제에 실패했습니다.'))
  }

  const handleDeleteRobot = (robotId: number) => {
    api.delete(`/robots/${robotId}`)
      .then(() => {
        closeConnection({ kind: 'robot', robotId })
        return loadRobots()
      })
      .catch(() => setRobotsError('로봇 삭제에 실패했습니다.'))
  }

  const mappedEvents = safetyEvents.map((event) => mapSafetyEvent(event, cameras))

  const isMonitorPage = activeTab === navTabs[0]
  const isEquipmentManagementPage = activeTab === navTabs[1]
  const isZoneSettingsPage = activeTab === navTabs[2]
  const isFieldRobotPage = activeTab === navTabs[3]
  const isRecordingPage = activeTab === navTabs[4]
  const isAnalysisPage = activeTab === navTabs[5]
  const isStatisticsPage = activeTab === navTabs[6]

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
              events={safetyEvents}
              onPlayClip={setActiveClipUrl}
            />
            <EventSidebar events={mappedEvents} loading={eventsLoading} error={eventsError} onPlayClip={setActiveClipUrl} />
          </div>
          <ControlPanel />
        </>

      ) : isEquipmentManagementPage ? (
        <EquipmentManagementPage
          cameras={cameras}
          camerasLoading={camerasLoading}
          camerasError={camerasError}
          onRegisterCamera={handleRegisterCamera}
          onDeleteCamera={handleDeleteCamera}
          robots={robots}
          robotsLoading={robotsLoading}
          robotsError={robotsError}
          onRegisterRobot={handleRegisterRobot}
          onDeleteRobot={handleDeleteRobot}
          equipments={equipments}
          equipmentsLoading={equipmentsLoading}
          equipmentsError={equipmentsError}
          onRegisterEquipment={handleRegisterEquipment}
          onDeleteEquipment={handleDeleteEquipment}
        />
      ) : isZoneSettingsPage ? (
        <ZoneSettingsPage
          cameras={cameras}
          camerasLoading={camerasLoading}
          selectedCameraId={selectedCameraId}
          onSelectCamera={setSelectedCameraId}
          zones={zones}
          zonesLoading={zonesLoading}
          zonesError={zonesError}
          zoneEditing={zoneEditing}
          zoneDraftPoints={zoneDraftPoints}
          onZonePointAdd={(point) => setZoneDraftPoints((current) => [...current, point])}
          onStartZoneEditing={() => { setZoneEditing(true); setZoneDraftPoints([]) }}
          onUndoZonePoint={() => setZoneDraftPoints((current) => current.slice(0, -1))}
          onCancelZoneEditing={() => { setZoneEditing(false); setZoneDraftPoints([]) }}
          onSaveZone={handleSaveZone}
          onDeleteZone={handleDeleteZone}
        />
      ) : isFieldRobotPage ? (
        <FieldRobotPage robots={robots} robotsLoading={robotsLoading} cameras={cameras} events={safetyEvents} />
      ) : isRecordingPage ? (
        <RecordingSearchPage cameras={cameras} events={safetyEvents} loading={eventsLoading} error={eventsError} onPlayClip={setActiveClipUrl} />
      ) : isAnalysisPage ? (
        <AiAnalysisPage cameras={cameras} events={safetyEvents} loading={eventsLoading} error={eventsError} onPlayClip={setActiveClipUrl} />
      ) : isStatisticsPage ? (
        <StatisticsPage cameras={cameras} events={safetyEvents} loading={eventsLoading} error={eventsError} />
      ) : (
        <main className="page-placeholder">
          <span className="page-placeholder__eyebrow">SAFE-VISION CONTROL CENTER</span>
          <h1>{activeTab}</h1>
          <p>이 페이지는 현재 메뉴 구조에 연결되어 있습니다. 세부 기능을 준비 중입니다.</p>
        </main>
      )}

      {activeClipUrl && <ClipModal clipUrl={activeClipUrl} onClose={() => setActiveClipUrl(null)} />}
    </div>
  )
}

export default App
