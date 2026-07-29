# SafeVision Frontend

산업 현장 컨베이어 안전 관제를 위한 React 기반 대시보드입니다. 실시간 관제, 위험구역 설정, 현장로봇 출동, 정비 모드, 위험 이벤트 이력, 통계 화면으로 구성되어 있습니다.

## Tech Stack

- React 19
- Vite
- TypeScript
- CSS (외부 라이브러리 없이 직접 작성)
- 라우팅 라이브러리 없이 탭 상태 기반 화면 전환

## 프로젝트 구조

```text
src/
  main.tsx                       # 엔트리
  App.tsx                        # 셸: 탭 상태, 상태 훅 호출, View 렌더링
  App.css / index.css
  api/                           # 도메인별 fetch 래퍼 (직접 fetch는 여기에만 존재)
    client.ts                    # API_BASE, 공통 request()
    cameras.ts
    zones.ts
    safetyEvents.ts
    equipment.ts
  hooks/
    useCameras.ts
    useVideoConnection.ts        # MJPEG 스트림 연결 상태
    useSafetyEventPolling.ts     # 3초 주기 안전 이벤트 폴링
    useClock.ts
  data/
    constants.ts                 # menus, seedEvents, initialRobots, initialMachines
  views/                         # 탭별 화면
    MonitorView.tsx
    ZonesView.tsx
    RobotsView.tsx
    MaintenanceView.tsx
    EventsView.tsx
    AnalyticsView.tsx
  components/
    layout/
      Header.tsx
      MainMenu.tsx
    camera/
      CameraFeed.tsx             # MJPEG <img> 기반 프리뷰
      CameraPicker.tsx
      CameraRegisterModal.tsx
    monitor/
      TrendChart.tsx
      SafetyStatus.tsx
      WorkerSummary.tsx
      RobotAvailability.tsx
    ui/
      ControlPanel.tsx
      EventTable.tsx
      EmergencyResponseModal.tsx
```

## 화면 구성 (탭)

| 탭 id | 이름 | View |
|---|---|---|
| `monitor` | 실시간 관제 | `MonitorView` |
| `zones` | 위험구역 설정 | `ZonesView` |
| `robots` | 현장로봇 출동 | `RobotsView` |
| `maintenance` | 정비 모드 | `MaintenanceView` |
| `events` | 위험 이벤트 | `EventsView` |
| `analytics` | 통계 및 분석 | `AnalyticsView` |

초기 진입 시 `?tab=` 쿼리 파라미터로 탭을 지정할 수 있습니다.

## 백엔드 연동 현황

백엔드는 `SafeVision-Backend`(FastAPI)입니다. 아래는 프론트가 실제로 호출하는 API와 백엔드 실제 라우터 코드(`app/api/routes/`) 기준 계약입니다. **`API_SPEC.md`(백엔드 문서)는 이 시점 기준 오래되어 zones/equipment를 "예정"으로 표기하고 있으나, 실제 코드에는 구현되어 있습니다.**

응답 포맷은 공통으로 `{ success, data, message }`입니다.

| 프론트 모듈 | Method | Path | 백엔드 상태 |
|---|---|---|---|
| `camerasApi.list` | GET | `/cameras` | 구현됨 (`data.items`) |
| `camerasApi.register` | POST | `/cameras` | 구현됨 |
| `camerasApi.mjpegUrl` | GET | `/cameras/{id}/mjpeg` | 구현됨 (MJPEG 스트림, `image/jpeg` multipart) |
| `zonesApi.list` | GET | `/zones` | 구현됨 |
| `zonesApi.create` | POST | `/zones` | 구현됨 |
| `zonesApi.remove` | DELETE | `/zones/{id}` | 구현됨 |
| `listSafetyEvents` | GET | `/safety-events?limit=` | 구현됨 |
| `equipmentApi.stop` | POST | `/equipment/stop` | 구현됨 |
| `equipmentApi.resume` | POST | `/equipment/resume` | 구현됨 |
| `equipmentApi.slow` | POST | `/equipment/slow` | 구현됨 |

프론트에서 아직 사용하지 않는 백엔드 기능: `auth`(로그인/회원가입), `webrtc`(offer/session) — 카메라 미리보기는 WebRTC가 아니라 MJPEG `<img>` 스트림으로 구현되어 있습니다.

### 알려진 불일치

- 프론트 `.env`의 `VITE_API_BASE_URL` 기본 포트가 `8081`인데, 백엔드 기본 실행 포트는 `8080`(`docker-compose.yml`, `Dockerfile` 기준)입니다. 로컬에서 8080으로 백엔드를 띄운다면 `.env` 포트를 맞춰야 연결됩니다.
- `equipment.stop/resume/slow`는 장비 ID를 받지 않는 전역 제어 API입니다. 설비가 여러 대가 되면 계약 변경이 필요합니다.

## 실행 방법

```bash
npm install
npm run dev        # 개발 서버
npm run build       # 프로덕션 빌드
npm run preview     # 빌드 결과 미리보기
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```
