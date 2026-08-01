import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { api } from '../api/client'
import type { Camera, MoveDirection, PtzDirection, Robot, RobotDispatch, SafetyEventRaw } from '../types'
import { eventTitle } from '../utils/events'
import { CameraGridBox } from '../components/monitor/CameraGridBox'
import './FieldRobotPage.css'

interface FieldRobotPageProps {
  robots: Robot[]
  robotsLoading?: boolean
  cameras: Camera[]
  events: SafetyEventRaw[]
}

const JOYSTICK_RADIUS = 54
const JOYSTICK_DEADZONE = 16
const PTZ_DIRECTION_LABELS: Record<PtzDirection, string> = {
  up: '상',
  down: '하',
  left: '좌',
  right: '우',
  stop: '정지',
}
const MOVE_DIRECTION_LABELS: Record<MoveDirection, string> = {
  forward: '전진',
  backward: '후진',
  left: '좌회전',
  right: '우회전',
  stop: '정지',
}

export function FieldRobotPage({ robots, robotsLoading, cameras, events }: FieldRobotPageProps) {
  const [selectedRobotId, setSelectedRobotId] = useState<number | null>(null)
  const [dispatches, setDispatches] = useState<RobotDispatch[]>([])
  const [ptzStatus, setPtzStatus] = useState<string | null>(null)
  const [emergencyStatus, setEmergencyStatus] = useState<string | null>(null)
  const [routeStatus, setRouteStatus] = useState<string | null>(null)
  const [ptzPosition, setPtzPosition] = useState({ x: 0, y: 0 })
  const [ptzDirection, setPtzDirection] = useState<PtzDirection>('stop')
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 })
  const [moveDirection, setMoveDirection] = useState<MoveDirection>('stop')
  const lastPtzDirection = useRef<PtzDirection>('stop')
  const lastMoveDirection = useRef<MoveDirection>('stop')
  const ptzRepeatTimer = useRef<number | null>(null)

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

  useEffect(() => {
    return () => {
      if (ptzRepeatTimer.current !== null) window.clearInterval(ptzRepeatTimer.current)
    }
  }, [])

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

  const stopPtzRepeat = () => {
    if (ptzRepeatTimer.current !== null) {
      window.clearInterval(ptzRepeatTimer.current)
      ptzRepeatTimer.current = null
    }
  }

  const startPtzRepeat = (direction: PtzDirection) => {
    stopPtzRepeat()
    if (direction === 'stop') {
      sendPtz('stop')
      return
    }
    sendPtz(direction)
    ptzRepeatTimer.current = window.setInterval(() => sendPtz(direction), 180)
  }

  const dispatchRobot = () => {
    if (!selectedRobot) return
    api.post(`/robots/${selectedRobot.id}/dispatch`, reasonEvent ? { safetyEventId: reasonEvent.id } : {})
      .then(() => api.get<RobotDispatch[]>(`/robots/${selectedRobot.id}/dispatches`))
      .then(setDispatches)
      .catch(() => undefined)
  }

  const sendRouteCommand = (action: 'start' | 'save' | 'clear' | 'play') => {
    if (!selectedRobot) return
    const messages = {
      start: '이동 경로 녹화를 시작했습니다.',
      save: '이동 경로를 저장했습니다.',
      clear: '저장된 이동 경로를 삭제했습니다.',
      play: '저장된 이동 경로 재생을 시작했습니다.',
    }
    setRouteStatus(null)
    api.post<{ sent: boolean }>(`/robots/${selectedRobot.id}/route-record/${action}`, {})
      .then((result) => setRouteStatus(result.sent ? messages[action] : '로봇에 경로 명령이 전달되지 않았습니다.'))
      .catch(() => setRouteStatus('경로 명령 전송에 실패했습니다.'))
  }

  const sendMove = (direction: MoveDirection) => {
    if (!selectedRobot) return
    setPtzStatus(null)
    api.post<{ sent: boolean }>(`/robots/${selectedRobot.id}/move`, { direction })
      .then((result) => setPtzStatus(result.sent ? null : '로봇에 주행 명령이 전달되지 않았습니다.'))
      .catch(() => setPtzStatus('로봇 주행 명령 전송에 실패했습니다.'))
  }

  const ptzDirectionFromVector = (x: number, y: number): PtzDirection => {
    if (Math.hypot(x, y) < JOYSTICK_DEADZONE) return 'stop'
    if (Math.abs(y) >= Math.abs(x)) return y < 0 ? 'up' : 'down'
    return x < 0 ? 'left' : 'right'
  }

  const moveDirectionFromVector = (x: number, y: number): MoveDirection => {
    if (Math.hypot(x, y) < JOYSTICK_DEADZONE) return 'stop'
    if (Math.abs(y) >= Math.abs(x)) return y < 0 ? 'forward' : 'backward'
    return x < 0 ? 'left' : 'right'
  }

  const joystickVector = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const rawX = event.clientX - centerX
    const rawY = event.clientY - centerY
    const distance = Math.hypot(rawX, rawY)
    const scale = distance > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / distance : 1
    const x = rawX * scale
    const y = rawY * scale
    return { x, y }
  }

  const updatePtzJoystick = (event: PointerEvent<HTMLDivElement>) => {
    const { x, y } = joystickVector(event)
    const nextDirection = ptzDirectionFromVector(x, y)

    setPtzPosition({ x, y })
    setPtzDirection(nextDirection)
    if (nextDirection !== lastPtzDirection.current) {
      lastPtzDirection.current = nextDirection
      startPtzRepeat(nextDirection)
    }
  }

  const updateMoveJoystick = (event: PointerEvent<HTMLDivElement>) => {
    const { x, y } = joystickVector(event)
    const nextDirection = moveDirectionFromVector(x, y)

    setJoystickPosition({ x, y })
    setMoveDirection(nextDirection)
    if (nextDirection !== lastMoveDirection.current) {
      lastMoveDirection.current = nextDirection
      sendMove(nextDirection)
    }
  }

  const startPtzJoystick = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    updatePtzJoystick(event)
  }

  const startMoveJoystick = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    updateMoveJoystick(event)
  }

  const stopPtzJoystick = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setPtzPosition({ x: 0, y: 0 })
    setPtzDirection('stop')
    stopPtzRepeat()
    if (lastPtzDirection.current !== 'stop') {
      lastPtzDirection.current = 'stop'
      sendPtz('stop')
    }
  }

  const stopMoveJoystick = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setJoystickPosition({ x: 0, y: 0 })
    setMoveDirection('stop')
    if (lastMoveDirection.current !== 'stop') {
      lastMoveDirection.current = 'stop'
      sendMove('stop')
    }
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

              <div className="field-robot__route-actions">
                <button type="button" onClick={() => sendRouteCommand('start')}>경로 녹화 시작</button>
                <button type="button" onClick={() => sendRouteCommand('save')}>현재 경로 저장</button>
                <button type="button" onClick={() => sendRouteCommand('play')}>저장 경로 재생</button>
                <button type="button" onClick={() => sendRouteCommand('clear')}>경로 삭제</button>
              </div>
              {routeStatus && <p className="field-robot__hint">{routeStatus}</p>}

              <div className="field-robot__control-row">
                <div className="field-robot__control">
                  <h3>로봇 카메라 제어</h3>
                  <div className="field-robot__drive-control">
                    <div
                      className="field-robot__drive-joystick"
                      role="application"
                      aria-label="로봇 카메라 제어 조이스틱"
                      onPointerDown={startPtzJoystick}
                      onPointerMove={(event) => event.currentTarget.hasPointerCapture(event.pointerId) && updatePtzJoystick(event)}
                      onPointerUp={stopPtzJoystick}
                      onPointerCancel={stopPtzJoystick}
                    >
                      <span className="field-robot__drive-axis field-robot__drive-axis--vertical" />
                      <span className="field-robot__drive-axis field-robot__drive-axis--horizontal" />
                      <span
                        className="field-robot__drive-knob"
                        style={{ transform: `translate(calc(-50% + ${ptzPosition.x}px), calc(-50% + ${ptzPosition.y}px))` }}
                      />
                    </div>
                    <span className="field-robot__drive-state">{PTZ_DIRECTION_LABELS[ptzDirection]}</span>
                  </div>
                  {ptzStatus && <p className="field-robot__warning">{ptzStatus}</p>}
                </div>

                <div className="field-robot__control">
                  <h3>로봇 수동 제어</h3>
                  <div className="field-robot__drive-control">
                    <div
                      className="field-robot__drive-joystick"
                      role="application"
                      aria-label="로봇 수동 조이스틱"
                      onPointerDown={startMoveJoystick}
                      onPointerMove={(event) => event.currentTarget.hasPointerCapture(event.pointerId) && updateMoveJoystick(event)}
                      onPointerUp={stopMoveJoystick}
                      onPointerCancel={stopMoveJoystick}
                    >
                      <span className="field-robot__drive-axis field-robot__drive-axis--vertical" />
                      <span className="field-robot__drive-axis field-robot__drive-axis--horizontal" />
                      <span
                        className="field-robot__drive-knob"
                        style={{ transform: `translate(calc(-50% + ${joystickPosition.x}px), calc(-50% + ${joystickPosition.y}px))` }}
                      />
                    </div>
                    <span className="field-robot__drive-state">{MOVE_DIRECTION_LABELS[moveDirection]}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
