/** [types.ts] SAFEVISION 시스템 전체에서 사용하는 데이터 구조 및 데이터 타입 정의 파일 */

/** [사용자 정보] 시스템 사용자의 계정 및 프로필 정보 구조 */
export interface User {
  /** 사용자 고유 ID */
  id: number
  /** 사용자 로그인 아이디 */
  username: string
  /** 사용자 성명 */
  name: string
  /** 사용자 전화번호 */
  phoneNumber: string
  /** 사용자 소속 부서 */
  department: string
  /** 사용자 시스템 접근 권한 */
  role: string
  /** 사용자 계정 생성 일시 */
  createdAt: string
}

/** [구역 좌표] 화면 내 특정 구역 지정을 위한 2D 위치 좌표 (x | y) */
export interface ZonePoint {
  /** X 축 좌표 */
  x: number
  /** Y 축 좌표 */
  y: number
}

/** [구역 타입] 구역 분류 (위험 | 제한 | 작업 | 관찰) */
export type ZoneType = 'DANGER' | 'RESTRICTED' | 'WORK' | 'OBSERVATION'

/** [구역 정보] 시스템 내 특정 구역의 설정 및 좌표 정보 구조 */
export interface Zone {
  /** 특정 구역 고유 ID */
  id: number
  /** 특정 구역 명칭 */
  name: string
  /** 연동 시 카메라 ID (미연동 시 null) */
  cameraId: number | null
  /** 특정 구역의 2D 좌표 리스트 */
  points: ZonePoint[]
  /** 특정 구역 시스템 활성화 여부 */
  isActive: boolean
  /** 특정 구역 타입 */
  zoneType: ZoneType
}

/** [카메라 상태 타입] 카메라 동작 상태 분류 (온라인 | 오프라인 | 점검 중 | 경고) */ 
export type CameraStatus = 'online' | 'offline' | 'maintenance' | 'alert'

/** [카메라 정보] 카메라 상태 및 설정 정보 구조 */
export interface Camera {
  /** 카메라 고유 ID (숫자 | 문자) */
  id: number | string
  /** 카메라 명칭 */
  name: string
  /** 카메라 현재 동작 상태 */
  status: CameraStatus
  /** 카메라 설치 장소 (선택 사항) */
  location?: string
  /** 카메라 실시간 비디오 스트리밍 주소 (선택 사항) */
  rtspUrl?: string
  /** 지도 상 구역의 X 좌표 (미지정 시 null | 선택 사항) */
  locationX?: number | null
  /** 지도 상 구역의 Y 좌표 (미지정 시 null | 선택 사항) */
  locationY?: number | null
  /** 카메라 시스템 선택 여부 (선택 사항) */
  selected?: boolean
}

/** [로봇 상태 타입] 로봇 동작 상태 분류 (대기 | 출동 | 오프라인) */
export type RobotStatus = 'IDLE' | 'DISPATCHED' | 'OFFLINE'

/** [로봇 정보] 로봇 제어 및 시스템 정보 구조 */
export interface Robot {
  /** 로봇 고유 ID */
  id: number
  /** 로봇 명칭 */
  name: string
  /** 로봇 원격 제어 주소 */
  controlAddress: string
  /** 로봇에 설치된 카메라 실시간 비디오 스트리밍 주소 */
  cameraRtspUrl: string
  /** 지도 상 구역의 X 좌표 (미지정 시 null) */
  locationX: number | null
  /** 지도 상 구역의 Y 좌표 (미지정 시 null) */
  locationY: number | null
  /** 로봇 현재 동작 상태 */
  status: RobotStatus
  /** 로봇 시스템 계정 등록 일시 */
  createdAt: string
}

/** [카메라 원격 제어 방향 타입] 카메라 원격 제어 방향 분류 (위 | 아래 | 왼쪽 | 오른쪽 | 정지) */
export type PtzDirection = 'up' | 'down' | 'left' | 'right' | 'stop'

/** [로봇 이동 제어 방향 타입] 로봇 이동 제어 명령 분류 (전진 | 후진 | 좌회전 | 우회전 | 정지) */
export type MoveDirection = 'forward' | 'backward' | 'left' | 'right' | 'stop'

/** [로봇 출동 정보] 로봇의 출동 상태 및 목표 좌표 정보 구조 */
export interface RobotDispatch {
  /** 출동 정보 고유 ID */
  id: number
  /** 출동 대상 로봇 ID */
  robotId: number
  /** 위험 이벤트 발생 ID (미발생 시 null) */
  safetyEventId: number | null
  /** 로봇 출동 시 목표 구역 X 좌표 (미지정 시 null) */
  targetX: number | null
  /** 로봇 출동 시 목표 구역 Y 좌표 (미지정 시 null) */
  targetY: number | null
  /** 로봇 출동 일시 */
  dispatchedAt: string
}

/** [통신 타입] 설비 제어 프로토콜 분류 (시리얼 | 네트워크) */
export type ControlProtocol = 'SERIAL' | 'NETWORK'

/** [설비 정보] 설비의 제어 통신 정보 구조 */
export interface Equipment {
  /** 설비 고유 ID */
  id: number
  /** 설비 명칭 */
  name: string
  /** 설비 제어 프로토콜 타입 */
  controlProtocol: ControlProtocol
  /** 설비 제어 통신 주소 */
  controlAddress: string
  /** 설비의 제어 통신 정보 업데이트 일시 */
  updatedAt: string
}

/** [카메라 표시 타입] 카메라 표시 분류 (정상 | 활성화 | 경고) */
export type CameraBoxState = 'normal' | 'active' | 'alert'

/** [카메라 표시 정보] 화면 상 카메라의 표시 정보 구조 */
export interface CameraBox {
  /** 화면 상 카메라 표시 고유 ID */
  id: string
  /** 화면 상 카메라 표시 명칭 */
  label: string
  /** 화면 상 카메라 표시 상태 */
  state: CameraBoxState
  /** 화면 상 카메라 표시 상태 텍스트로 표시 (선택 사항) */
  badge?: string
  /** 화면 상 AI 위험 감지 결과 텍스트로 표시 (선택 사항) */
  detection?: {
    text: string
  }
}

/** [위험 이벤트 타입] 위험 이벤트 분류 (위험 | 경고 | 정보) */
export type EventSeverity = 'danger' | 'warning' | 'info'

/** [위험 이벤트 정보] 위험 이벤트 정보 구조 */
export interface SafetyEvent {
  /** 위험 이벤트 고유 ID */
  id: string
  /** 위험 이벤트 레벨 */
  severity: EventSeverity
  /** 위험 이벤트 타이틀 */
  title: string
  /** 위험 이벤트 상세 설명 */
  description: string
  /** 위험 이벤트 추가 정보 */
  meta: string
  /** 위험 이벤트 화면 내 버튼 표기 텍스트 */
  actionLabel: string
  /** 클립 비디오 주소 (선택 사항) */
  clipUrl?: string
}

/** [원본 위험 이벤트 정보] 백엔드에서 전달받은 원본 이벤트 정보 구조 */ 
export interface SafetyEventRaw {
  /** 원본 위험 이벤트 고유 ID */
  id: number
  /** 원본 카메라 고유 ID (미연동 시 null) */
  cameraId: number | null
  /** 원본 설비 고유 ID (미연동 시 null) */
  equipmentId: number | null
  /** 원본 특정 구역 고유 ID (미지정 시 null) */
  zoneId: number | null
  /** 원본 위험 이벤트 타입 */
  eventType: string
  /** 원본 위험 이벤트 레벨 */
  eventLevel: number
  /** 원본 클립 경로 (미존재 시 null) */
  clipPath: string | null
  /** 원본 위험 이벤트 생성 일시 */
  createdAt: string
}
