import type { CameraBox } from '../types'

export const cameraBoxes: CameraBox[] = [
  { id: 'CAM-01', label: 'CAM-01 로비', state: 'normal', badge: 'LIVE' },
  {
    id: 'CAM-02',
    label: 'CAM-02 동측 주차장 [선택됨]',
    state: 'active',
    detection: { text: 'Vehicle 98%' },
  },
  {
    id: 'CAM-03',
    label: 'CAM-03 외곽 펜스 [경보]',
    state: 'alert',
    badge: 'EVENT',
    detection: { text: '침입 감지!' },
  },
  { id: 'CAM-04', label: 'CAM-04 B1 주차장', state: 'normal' },
  { id: 'CAM-05', label: 'CAM-05 후문 출입구', state: 'normal' },
  { id: 'CAM-06', label: 'CAM-06 옥상 비상구', state: 'normal' },
  { id: 'CAM-07', label: 'CAM-07 엘리베이터 1호', state: 'normal' },
  { id: 'CAM-08', label: 'CAM-08 외곽 동쪽 펜스', state: 'normal' },
  { id: 'CAM-09', label: 'CAM-09 전기실 내부', state: 'normal' },
]

export const navTabs = ['실시간 관제', '카메라 관리', '위험구역 설정', '녹화 검색', 'AI 지능형 분석', '통계/리포트']

export const layoutOptions = ['1x1', '2x2', '3x3', '4x4']

export const timelineScale = ['08:00', '09:00', '10:00', '11:00', '12:00']
