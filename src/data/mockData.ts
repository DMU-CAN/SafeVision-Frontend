import type { CameraBox, CameraZone, SafetyEvent } from '../types'

export const cameraZones: CameraZone[] = [
  {
    zone: '제1구역 (A동 빌딩)',
    cameras: [
      { id: 'CAM-01', name: '메인 로비 Central', status: 'online' },
      { id: 'CAM-02', name: '동측 주차장 입구', status: 'online', selected: true },
      { id: 'CAM-03', name: '외곽 펜스 N-1', status: 'alert' },
      { id: 'CAM-04', name: 'B1 지하주차장', status: 'online' },
    ],
  },
  {
    zone: '제2구역 (B동 외곽)',
    cameras: [
      { id: 'CAM-05', name: '후문 출입구', status: 'online' },
      { id: 'CAM-06', name: '옥상 비상구', status: 'offline' },
    ],
  },
]

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

export const safetyEvents: SafetyEvent[] = [
  {
    id: 'evt-1',
    severity: 'danger',
    title: '⚠️ [월담/침입] CAM-03 펜스',
    description: '구역 N-1 외곽 감지선 침범',
    meta: '10:46:12 | 미확인 객체 1명',
    actionLabel: '확인',
  },
  {
    id: 'evt-2',
    severity: 'warning',
    title: '🚗 [차량 인식] CAM-02 주차장',
    description: '미등록 차량 진입 (12가 3456)',
    meta: '10:42:05 | 게이트 A',
    actionLabel: '상세',
  },
  {
    id: 'evt-3',
    severity: 'info',
    title: '👤 [얼굴 인식] CAM-01 로비',
    description: '등록 임직원 출입 확인 (김철수)',
    meta: '10:38:19 | 스피드게이트 2호',
    actionLabel: '상세',
  },
  {
    id: 'evt-4',
    severity: 'warning',
    title: '🔥 [배회 감지] CAM-08 외곽',
    description: '동쪽 담장 주변 5분 이상 배회',
    meta: '10:15:40 | 객체 1명',
    actionLabel: '상세',
  },
]

export const navTabs = ['실시간 관제', '녹화 검색', 'AI 지능형 분석', '통계/리포트']

export const layoutOptions = ['1x1', '2x2', '3x3', '4x4']

export const timelineScale = ['08:00', '09:00', '10:00', '11:00', '12:00']
