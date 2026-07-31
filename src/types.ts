export interface User {
  id: number
  username: string
  name: string
  phoneNumber: string
  department: string
  role: string
  createdAt: string
}

export interface ZonePoint {
  x: number
  y: number
}

export interface Zone {
  id: number
  name: string
  cameraId: number | null
  points: ZonePoint[]
  isActive: boolean
}

export type CameraStatus = 'online' | 'offline' | 'maintenance' | 'alert'

export interface Camera {
  id: number | string
  name: string
  status: CameraStatus
  location?: string
  rtspUrl?: string
  locationX?: number | null
  locationY?: number | null
  selected?: boolean
}

export type RobotStatus = 'IDLE' | 'DISPATCHED' | 'OFFLINE'

export interface Robot {
  id: number
  name: string
  controlAddress: string
  cameraRtspUrl: string
  locationX: number | null
  locationY: number | null
  status: RobotStatus
  createdAt: string
}

export type PtzDirection = 'up' | 'down' | 'left' | 'right' | 'zoomIn' | 'zoomOut' | 'stop'

export interface RobotDispatch {
  id: number
  robotId: number
  safetyEventId: number | null
  targetX: number | null
  targetY: number | null
  dispatchedAt: string
}

export type ControlProtocol = 'SERIAL' | 'NETWORK'

export interface Equipment {
  id: number
  name: string
  controlProtocol: ControlProtocol
  controlAddress: string
  updatedAt: string
}

export type CameraBoxState = 'normal' | 'active' | 'alert'

export interface CameraBox {
  id: string
  label: string
  state: CameraBoxState
  badge?: string
  detection?: {
    text: string
  }
}

export type EventSeverity = 'danger' | 'warning' | 'info'

export interface SafetyEvent {
  id: string
  severity: EventSeverity
  title: string
  description: string
  meta: string
  actionLabel: string
  clipUrl?: string
}

export interface SafetyEventRaw {
  id: number
  cameraId: number | null
  equipmentId: number | null
  zoneId: number | null
  eventType: string
  eventLevel: number
  clipPath: string | null
  createdAt: string
}
