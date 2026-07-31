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
import { EquipmentManagementPage } from './pages/EquipmentManagementPage'
import { ZoneSettingsPage } from './pages/ZoneSettingsPage'
import { FieldRobotPage } from './pages/FieldRobotPage'
import './App.css'
import { api, getStoredUser, isAuthenticated, UNAUTHORIZED_EVENT } from './api/client'
import type { ZonePoint, ZoneType } from './types'
import { ControlPanel } from './components/control/ControlPanel'
import { closeAllConnections, closeConnection } from './hooks/webrtcManager'
import { mapSafetyEvent } from './utils/events'
import { ClipModal } from './components/common/ClipModal'
import { useCameras } from './hooks/useCameras'
import { useRobots } from './hooks/useRobots'
import { useEquipments } from './hooks/useEquipments'
import { useSafetyEvents } from './hooks/useSafetyEvents'
import { useZones } from './hooks/useZones'

const ZONES_REFRESH_INTERVAL_MS = 15000

function App() {
  const now = useClock()
  const [authed, setAuthed] = useState(isAuthenticated)
  const [activeTab, setActiveTab] = useState(navTabs[0])
  const [selectedCameraId, setSelectedCameraId] = useState<number | string | null>(null)
  const [zoneEditing, setZoneEditing] = useState(false)
  const [zoneDraftPoints, setZoneDraftPoints] = useState<ZonePoint[]>([])
  const [activeClipUrl, setActiveClipUrl] = useState<string | null>(null)
  const { cameras, camerasLoading, camerasError, loadCameras, registerCamera, deleteCamera } = useCameras()
  const { robots, robotsLoading, robotsError, loadRobots, registerRobot, deleteRobot } = useRobots()
  const { equipments, equipmentsLoading, equipmentsError, loadEquipments, registerEquipment, deleteEquipment } = useEquipments()
  const { safetyEvents, eventsLoading, eventsError } = useSafetyEvents(authed)
  const { zones, zonesLoading, zonesError, loadZones, saveZone, deleteZone } = useZones()

  useEffect(() => {
    const handleUnauthorized = () => setAuthed(false)
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  useEffect(() => {
    if (!authed) return
    loadCameras().then((normalized) => setSelectedCameraId((current) => current ?? normalized[0]?.id ?? null))
    loadRobots()
    loadEquipments()
  }, [authed, loadCameras, loadRobots, loadEquipments])

  useEffect(() => {
    if (!authed) return
    setZoneEditing(false)
    setZoneDraftPoints([])
    loadZones(selectedCameraId)
  }, [authed, selectedCameraId, loadZones])

  useEffect(() => {
    if (!authed || !selectedCameraId || zoneEditing) return
    const interval = setInterval(() => loadZones(selectedCameraId), ZONES_REFRESH_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [authed, selectedCameraId, zoneEditing, loadZones])

  if (!authed) {
    return <LoginPage onSuccess={() => setAuthed(true)} />
  }

  const user = getStoredUser()
  const handleLogout = () => { closeAllConnections(); api.logout().finally(() => setAuthed(false)) }

  const handleSaveZone = (name: string, zoneType: ZoneType) => {
    if (!selectedCameraId || zoneDraftPoints.length < 3) return
    saveZone({ name, cameraId: selectedCameraId, points: zoneDraftPoints, zoneType })
      .then(() => {
        setZoneEditing(false)
        setZoneDraftPoints([])
      })
  }

  const handleDeleteZone = (zoneId: number) => {
    deleteZone(zoneId, selectedCameraId)
  }

  const handleDeleteCamera = (cameraId: number | string) => {
    deleteCamera(cameraId)
      .then(() => {
        if (typeof cameraId === 'number') closeConnection({ kind: 'camera', cameraId })
      })
  }

  const handleDeleteRobot = (robotId: number) => {
    deleteRobot(robotId)
      .then(() => {
        closeConnection({ kind: 'robot', robotId })
      })
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
          onRegisterCamera={registerCamera}
          onDeleteCamera={handleDeleteCamera}
          robots={robots}
          robotsLoading={robotsLoading}
          robotsError={robotsError}
          onRegisterRobot={registerRobot}
          onDeleteRobot={handleDeleteRobot}
          equipments={equipments}
          equipmentsLoading={equipmentsLoading}
          equipmentsError={equipmentsError}
          onRegisterEquipment={registerEquipment}
          onDeleteEquipment={deleteEquipment}
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
