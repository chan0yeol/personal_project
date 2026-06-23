# uni_data 프로젝트

유니포스트 사내 시스템 데이터를 수집해 PostgreSQL에 적재하고, 사내 다른 시스템에 REST API로 제공하는 데이터 수집 서버.

---

## 기술 스택

- **런타임**: Node.js 20
- **웹 프레임워크**: Express
- **DB**: PostgreSQL 16 (192.168.12.211 / unipost_insa)
- **DB 클라이언트**: pg (node-postgres)
- **스케줄러**: node-cron
- **인프라**: Docker Compose

---

## 프로젝트 구조

```
uni_data/
├── docker-compose.yml
├── Dockerfile
├── .env
├── package.json
├── API.md              # API 상세 문서
├── PROJECT.md          # 이 파일
└── src/
    ├── index.js        # Express 서버 + 크론 초기화
    ├── db.js           # pg Pool 커넥션
    ├── login.js        # 포털/AVS/GW SSO 로그인
    ├── collect.js      # 휴가·회의실·출퇴근 수집 + DB upsert
    ├── hr.js           # 인사정보 배치 (입사/퇴사/변동 감지)
    └── api.js          # 읽기 전용 REST API
```

---

## 수집 데이터 및 출처

| 테이블 | 데이터 | 출처 API |
|--------|--------|---------|
| `users` | 인사정보 (이름, 부서, 직위 등) | `getOrganizationUserTreeList` |
| `user_history` | 인사 변동 이력 (입사/퇴사/부서이동) | 배치 비교 감지 |
| `commute_records` | 출퇴근 기록 + 당일 휴가 정보 (종일/반차 여부, 휴가 시작·종료 시각) | `getCommuteMonthDetail` |
| `vacations` | 휴가 기록 (종일/반차/시간 단위) | `getMonthReportAvsUse` |
| `room_bookings` | 회의실 예약 현황 | `getFolderReservation` |
| `holidays` | 공휴일 기준 정보 (연도별 수동 수집) | `getAvsSetHoliday` |
| `departments` | 조직도 계층 구조 (부서 코드·이름·레벨·부모) | schema.sql 시드 데이터 |

---

## 로그인 구조

유니포스트 포털 SSO 방식으로 인증.

```
포털 로그인 (loginPortal)
    ├── HR API → 포털 쿠키 그대로 사용
    ├── AVS (휴가/출퇴근) → SSO 리다이렉트 → avsCookie
    └── GW (회의실) → SSO 리다이렉트 → gwCookie
```

---

## 크론 스케줄

| 작업 | 주기 | 내용 |
|------|------|------|
| `syncAll` | 매 10분 (UTC) | 오늘 휴가·회의실·출퇴근 실시간 갱신 |
| `runHrBatch` | 매일 01:00 KST | 인사정보 전체 수집 및 변동 감지 |
| `commuteBackfill` | 매일 02:00 KST | 이번 달 출퇴근 전체 백필 (누락 방지) |
| `keepSessions` | 매 30분 (UTC) | AVS·GW 세션 유지 |

### syncAll 수집 범위

| 데이터 | 범위 | 이유 |
|--------|------|------|
| 휴가 | 오늘 ~ 60일 후 | 미래 휴가 계획 조회 |
| 회의실 | 오늘 ~ 14일 후 | 2주 예약 현황 |
| 출퇴근 | 오늘 하루만 | 실시간 출근 여부 확인 |

---

## 환경변수 (.env)

```env
DATABASE_URL=postgresql://insa:insa1234@192.168.12.211:5432/unipost_insa

PORT=4100
TZ=Asia/Seoul

LOGIN_ID=유니포스트_로그인_ID
LOGIN_PW=유니포스트_로그인_PW
```

---

## DB 스키마 적용

최초 1회 실행 (192.168.12.211에서):

```bash
docker exec -i [db컨테이너명] psql -U insa -d unipost_insa < schema.sql
```

`schema.sql`에는 `uni_data`가 사용하는 5개 테이블 외에 slack bot용 테이블(app_settings, snapshots, teams, cron_settings)도 포함되어 있으나, uni_data는 사용하지 않음.

---

## 배포

```bash
npm install
docker compose up -d --build
```

### 최초 기동 시 수동 실행 권장

```bash
# 인사정보 즉시 수집 (자동 크론 전 데이터 채우기)
curl -X POST http://localhost:4100/api/hr-batch

# 확인
curl http://localhost:4100/api/health
curl http://localhost:4100/api/users
curl http://localhost:4100/api/commute/today
```

---

## API 요약

전체 상세는 `API.md` 참고.

| 경로 | 설명 |
|------|------|
| `GET /api/users` | 인사 목록 |
| `GET /api/users/:usId` | 단건 조회 |
| `GET /api/history` | 변동 이력 |
| `GET /api/departments` | 부서 목록 flat (parent/level/root 필터, path 동적 계산) |
| `GET /api/departments/tree` | 부서 계층 트리 |
| `GET /api/dashboard/today` | 팀원별 오늘 근태 현황 (출근/미출근/휴가/공휴일 등) |
| `GET /api/dashboard/stats` | 기간별 근태 통계 (출근일수, 지각횟수, 평균 출근시각 등) |
| `GET /api/dashboard/late` | 기간별 지각자 목록 |
| `GET /api/commute/today` | 오늘 출퇴근 현황 (raw) |
| `GET /api/commute/absent` | 미출근자 (휴가자 제외) |
| `GET /api/commute` | 기간별 출퇴근 (raw) |
| `GET /api/vacations` | 휴가 조회 |
| `GET /api/holidays` | 공휴일 조회 |
| `GET /api/rooms` | 회의실 예약 |
| `POST /api/sync` | 수동 즉시 동기화 |
| `POST /api/hr-batch` | 수동 HR 배치 실행 |
| `POST /api/sync-holidays` | 공휴일 수집 (연도 지정) |
| `POST /api/backfill-commute` | 이번 달 출퇴근 전체 재동기화 |
| `GET /api/health` | DB 연결 상태 |

---

## 주요 결정사항

- **Slack bot과 DB 공유**: 같은 DB를 쓰지만 slack bot은 JSON 파일로 운영, uni_data만 DB 사용
- **출퇴근 수집 분리**: 10분마다 오늘치만 / 매일 새벽 2시에 이번 달 전체 백필로 부하 분산
- **부서 ID 구조**: 구독그룹(0009) > 구독6팀(A00000022). 출퇴근 API는 `deptId: "00"` 으로 전사 조회 후 각 레코드의 `deptId`(A00000022) 사용
- **미출근자 판단**: `actual_start_time IS NULL` AND `vacations` 테이블과 JOIN해서 휴가자 제외
- **commute_records 휴가 필드**: `avsCommuteWeekList`가 출퇴근+휴가 정보를 함께 반환. `time_unit(FULL/HOUR)`, `vac_stime`, `vac_etime` 등을 함께 저장해 출근 예정 시각 판단에 활용 (출근 전엔 `workStime`이 null이므로)
- **departments 계층 조회**: 별도 path 컬럼 없이 recursive CTE로 동적 계산. 시드 데이터는 schema.sql에 하드코딩
- **대시보드 status 판단 순서**: 공휴일 → 종일휴가 → 반차출근 → 출근 → 반차 → 미출근 → 미등록. `dept_id/root` 파라미터로 특정 팀·부문 필터 가능
- **공휴일 수집**: 연 1회 수동(`POST /api/sync-holidays?year=YYYY`) + 매년 1월 1일 01:30 KST 자동 수집. `deduct_yn` 필드로 차감 여부 구분 가능
