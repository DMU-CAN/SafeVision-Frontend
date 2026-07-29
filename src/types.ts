export interface User {
  id: number
  username: string
  name: string
  phoneNumber: string
  department: string
  role: string
  createdAt: string
}

export type CameraStatus = 'online' | 'offline' | 'maintenance' | 'alert'

export interface Camera {
  id: number | string
  name: string
  status: CameraStatus
  location?: string
  selected?: boolean
}

export interface CameraZone {
  zone: string
  cameras: Camera[]
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
}
