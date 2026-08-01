import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { Camera, PtzDirection, Robot, RobotDispatch, SafetyEventRaw } from '../types'
import { eventTitle } from '../utils/events'
import { CameraGridBox } from '../components/monitor/CameraGridBox'
import './FieldRobotPage.css'

interface FieldRobotPageProps {
  robots: Robot[]
  robotsLoading?: boolean
  cameras: Camera[]
  events: SafetyEventRaw[]
}

const PTZ_BUTTONS: { direction: PtzDirection; label: string }[] = [
  { direction: 'up', label: '▲' },
  { direction: 'left', label: '◀' },
  { direction: 'stop', label: '■' },
  { direction: 'right', label: '▶' },
  { direction: 'down', label: '▼' },
  { direction: 'zoomIn', label: '줌 +' },
  { direction: 'zoomOut', label: '줌 -' },
]

export function FieldRobotPage({ robots, robotsLoading, cameras, events }: FieldRobotPageProps) {
  const [selectedRobotId, setSelectedRobotId] = useState<number | null>(null)
  const [dispatches, setDispatches] = useState<RobotDispatch[]>([])
  const [ptzStatus, setPtzStatus] = useState<string | null>(null)
  const [emergencyStatus, setEmergencyStatus] = useState<string | null>(null)

  useEffect(() => {
    const dispatchedRobot = robots.find((robot) => robot.status === 'DISPATCHED')
    if (dispatchedRobot && selectedRobotId !== dispatchedRobot.id) {
      setSelectedRobotId(dispatchedRobot.id)
      return
    }
    if (selectedRobotId === null && robots.length > 0) setSelectedRobotId(robots[0].id)
  }, [robots, selectedRobotId])

  useEffect(() => {
    if (selectedRobotId === null) return
    api.get<RobotDispatch[]>(`/robots/${selectedRobotId}/dispatches`).then(setDispatches).catch(() => setDispatches([]))
  }, [selectedRobotId, events])

  const selectedRobot = robots.find((robot) => robot.id === selectedRobotId) ?? null
  const latestDispatch = dispatches[0] ?? null
  const isDispatched = selectedRobot?.status === 'DISPATCHED'
  const reasonEvent = useMemo(
    () => (isDispatched && latestDispatch?.safetyEventId ? events.find((event) => event.id === latestDispatch.safetyEventId) : undefined),
    [isDispatched, latestDispatch, events],
  )
  const reasonCamera = useMemo(
    () => (reasonEvent?.cameraId != null ? cameras.find((camera) => camera.id === reasonEvent.cameraId) : undefined),
    [reasonEvent, cameras],
  )

  const sendPtz = (direction: PtzDirection) => {
    if (!selectedRobot) return
    setPtzStatus(null)
    api.post<{ sent: boolean }>(`/robots/${selectedRobot.id}/ptz`, { direction })
      .then((result) => setPtzStatus(result.sent ? null : '로봇에 명령이 전달되지 않았습니다.'))
      .catch(() => setPtzStatus('PTZ 명령 전송에 실패했습니다.'))
  }

  const dispatchRobot = () => {
    if (!selectedRobot) return
    api.post(`/robots/${selectedRobot.id}/dispatch`, reasonEvent ? { safetyEventId: reasonEvent.id } : {})
      .then(() => api.get<RobotDispatch[]>(`/robots/${selectedRobot.id}/dispatches`))
      .then(setDispatches)
      .catch(() => undefined)
  }

  const returnRobot = () => {
    if (!selectedRobot) return
    api.post(`/robots/${selectedRobot.id}/return`, {})
      .then(() => api.get<RobotDispatch[]>(`/robots/${selectedRobot.id}/dispatches`))
      .then(setDispatches)
      .catch(() => setPtzStatus('로봇 복귀 명령 전송에 실패했습니다.'))
  }

  const callEmergency = (kind: 'contact' | 'share') => {
    setEmergencyStatus(null)
    api.post<{ connected?: boolean; shared?: boolean }>(`/emergency/${kind}`, {
      robotId: selectedRobot?.id,
      safetyEventId: reasonEvent?.id,
    })
      .then(() => setEmergencyStatus(kind === 'contact' ? '응급센터에 연결 요청을 전송했습니다.' : '현장 상황을 공유했습니다.'))
      .catch(() => setEmergencyStatus('요청 전송에 실패했습니다.'))
  }

  return (
    <main className="field-robot">
      <span className="field-robot__eyebrow">SAFE-VISION CONTROL CENTER</span>
      <h1>현장 로봇</h1>

      <div className="field-robot__body">
        <aside className="field-robot__list">
          <h2>로봇 선택</h2>
          {robotsLoading && <p className="field-robot__hint">불러오는 중...</p>}
          {!robotsLoading && robots.length === 0 && <p className="field-robot__hint">등록된 로봇이 없습니다.</p>}
          {!robotsLoading && robots.map((robot) => (
            <button
              key={robot.id}
              type="button"
              className={robot.id === selectedRobotId ? 'field-robot__item field-robot__item--active' : 'field-robot__item'}
              onClick={() => setSelectedRobotId(robot.id)}
            >
              ROBOT-{String(robot.id).padStart(2, '0')} {robot.name}
              <span className={`field-robot__status field-robot__status--${robot.status.toLowerCase()}`}>{robot.status}</span>
            </button>
          ))}
        </aside>

        {!selectedRobot && <p className="field-robot__hint">로봇을 선택하세요.</p>}

        {selectedRobot && (
          <section className="field-robot__stage">
            <div className={reasonCamera ? 'field-robot__cameras field-robot__cameras--incident' : 'field-robot__cameras'}>
              <div className="field-robot__camera-block">
                <h2>로봇 카메라</h2>
                <div className="field-robot__video">
                  <CameraGridBox box={{ id: `robot-${selectedRobot.id}`, label: selectedRobot.name, state: 'normal' }} robotId={selectedRobot.id} />
                </div>
              </div>

              {reasonCamera && (
                <div className="field-robot__camera-block">
                  <h2>사고 현장 CCTV (CAM-{String(reasonCamera.id).padStart(2, '0')})</h2>
                  <div className="field-robot__video">
                    <CameraGridBox box={{ id: String(reasonCamera.id), label: reasonCamera.name, state: 'normal' }} yoloEnabled={false} />
                  </div>
                </div>
              )}
            </div>

            <div className="field-robot__info">
              <h2>출동 정보</h2>
              <div className="field-robot__dispatch-actions">
                <button type="button" className="field-robot__dispatch-btn" onClick={dispatchRobot}>이 로봇 출동</button>
                <button type="button" className="field-robot__return-btn" onClick={returnRobot} disabled={selectedRobot.status === 'IDLE'}>로봇 복귀</button>
              </div>
              {!latestDispatch && <p className="field-robot__hint">출동 이력이 없습니다.</p>}
              {latestDispatch && (
                <div className="field-robot__dispatch">
                  <div><span>출동 시각</span><b>{new Date(latestDispatch.dispatchedAt).toLocaleString()}</b></div>
                  <div><span>출동 사유</span><b>{reasonEvent ? eventTitle(reasonEvent.eventType) : '수동 출동'}</b></div>
                  <div><span>출동 좌표</span><b>{latestDispatch.targetX != null && latestDispatch.targetY != null ? `(${latestDispatch.targetX}, ${latestDispatch.targetY})` : '좌표 정보 없음'}</b></div>
                </div>
              )}

              <div className="field-robot__emergency">
                <button type="button" className="field-robot__emergency-btn field-robot__emergency-btn--contact" onClick={() => callEmergency('contact')}>응급센터 연결</button>
                <button type="button" className="field-robot__emergency-btn" onClick={() => callEmergency('share')}>현장 상황 공유</button>
              </div>
              {emergencyStatus && <p className="field-robot__hint">{emergencyStatus}</p>}

              <div className="field-robot__control">
                <h3>로봇 카메라 제어</h3>
                <div className="field-robot__ptz">
                  {PTZ_BUTTONS.map((button) => (
                    <button key={button.direction} type="button" className={`field-robot__ptz-btn field-robot__ptz-btn--${button.direction}`} onClick={() => sendPtz(button.direction)}>
                      {button.label}
                    </button>
                  ))}
                </div>
                {ptzStatus && <p className="field-robot__warning">{ptzStatus}</p>}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
