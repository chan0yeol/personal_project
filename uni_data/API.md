# uni_data API 문서

Base URL: `http://[서버]:4100`

---

## 인사정보

### 인사 목록 조회
```
GET /api/users
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `dept_id` | string | - | 부서 코드 (부분 일치) |
| `dept_name` | string | - | 부서명 (부분 일치) |
| `name` | string | - | 이름 (부분 일치) |
| `role` | string | - | 직책 (부분 일치) |
| `pos` | string | - | 직위 (부분 일치) |
| `active_only` | boolean | - | 기본 `true` / `false` 시 퇴사자 포함 |

**응답 예시**
```json
[
  {
    "us_id": "chanyeol5",
    "us_name": "오찬열",
    "dept_id": "A00000022",
    "dept_name": "구독6팀",
    "us_roll_name": null,
    "us_pos_name": "매니저",
    "us_mail1": "chanyeol5@unipost.co.kr",
    "us_cellno": "010-2743-6807",
    "us_telno": "02-6958-5174",
    "slack_id": "U09SJ2F3TL1",
    "is_leader": false,
    "enter_date": "2025-09-02",
    "retire_date": null,
    "emp_no": "U2509003",
    "user_show_yn": "Y"
  }
]
```

**예시**
```
GET /api/users
GET /api/users?dept_name=구독6팀
GET /api/users?name=오찬열
GET /api/users?pos=매니저
GET /api/users?active_only=false
```

---

### 사용자 단건 조회
```
GET /api/users/:usId
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `usId` | string | ✅ | 유니포스트 로그인 ID |

**예시**
```
GET /api/users/chanyeol5
```

---

### 인사 변동 이력
```
GET /api/history
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `us_id` | string | - | 특정 사용자 필터 |
| `type` | string | - | 변동 유형 필터 |
| `limit` | number | - | 최대 건수 (기본 100, 최대 500) |

**type 값**

| 값 | 설명 |
|----|------|
| `JOIN` | 입사 |
| `LEAVE` | 퇴사 |
| `DEPT_CHANGE` | 부서 변동 |
| `ROLE_CHANGE` | 직책/직위 변동 |

**응답 예시**
```json
[
  {
    "id": 1,
    "us_id": "chanyeol5",
    "us_name": "오찬열",
    "change_type": "DEPT_CHANGE",
    "field_name": "dept_name",
    "old_value": "구독5팀",
    "new_value": "구독6팀",
    "detected_at": "2026-04-01T01:00:00.000Z"
  }
]
```

**예시**
```
GET /api/history
GET /api/history?type=JOIN
GET /api/history?type=DEPT_CHANGE&limit=50
GET /api/history?us_id=chanyeol5
```

---

## 대시보드

### 오늘 근태 현황
```
GET /api/dashboard/today
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `date` | string | - | 날짜 `YYYY-MM-DD` (기본: 오늘) |
| `dept_id` | string | - | 부서 코드 (정확히 일치) |
| `dept_name` | string | - | 부서명 부분 일치 (예: `구독6팀`) |
| `root` | string | - | 상위 부서 코드 (하위 전체 포함, 예: `0009`) |

**status 값**

| 값 | 설명 |
|----|------|
| `출근` | 출근 등록 완료 |
| `반차출근` | 반차 + 출근 등록 완료 |
| `미출근` | 출근 미등록 (API 레코드 있음) |
| `반차` | 반차 + 아직 미출근 |
| `종일휴가` | 종일 연차/휴가 |
| `공휴일` | 공휴일 테이블에 등록된 날 |
| `미등록` | 출퇴근 API에 레코드 없음 |

**응답 예시**
```json
{
  "date": "2026-04-27",
  "count": 7,
  "summary": { "출근": 4, "미출근": 1, "반차": 1, "종일휴가": 1, "공휴일": 0 },
  "records": [
    {
      "us_id": "chanyeol5", "name": "오찬열", "dept_id": "A00000022", "dept_name": "구독6팀",
      "status": "출근", "actual_start_time": "08:55:00", "actual_end_time": null,
      "work_minutes": null, "is_late": false,
      "time_unit": null, "time_unit_name": null, "vac_stime": null, "vac_etime": null,
      "holiday_name": null
    }
  ]
}
```

**예시**
```
GET /api/dashboard/today
GET /api/dashboard/today?dept_id=A00000022
GET /api/dashboard/today?root=0009
GET /api/dashboard/today?date=2026-04-25&root=0009
```

---

### 기간별 근태 통계
```
GET /api/dashboard/stats
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `sdate` | string | ✅ | 시작일 |
| `edate` | string | ✅ | 종료일 |
| `dept_id` | string | - | 부서 코드 |
| `dept_name` | string | - | 부서명 부분 일치 |
| `root` | string | - | 상위 부서 코드 (하위 전체) |
| `name` | string | - | 이름 필터 (부분 일치) |

**응답 예시**
```json
{
  "sdate": "2026-04-01", "edate": "2026-04-30", "count": 7,
  "records": [
    {
      "name": "오찬열", "dept_id": "A00000022", "dept_name": "구독6팀",
      "total_days": 20, "attended_days": 19, "absent_days": 1,
      "late_count": 2, "vacation_days": 0,
      "avg_start_min": 549,
      "total_work_minutes": 9120
    }
  ]
}
```

> `avg_start_min`: 자정 기준 분 (549 = 9시 9분)

---

### 지각자 목록
```
GET /api/dashboard/late
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `sdate` | string | - | 시작일 (기본: 오늘) |
| `edate` | string | - | 종료일 (기본: 오늘) |
| `dept_id` | string | - | 부서 코드 |
| `dept_name` | string | - | 부서명 부분 일치 |
| `root` | string | - | 상위 부서 코드 (하위 전체) |

**응답 예시**
```json
{
  "sdate": "2026-04-01", "edate": "2026-04-30", "count": 3,
  "records": [
    { "name": "홍길동", "dept_id": "A00000022", "work_date": "2026-04-10", "actual_start_time": "09:15:00", "time_unit_name": null }
  ]
}
```

---

## 공휴일

### 공휴일 조회
```
GET /api/holidays
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `year` | integer | - | 연도 (해당 연도 전체) |
| `sdate` | string | - | 시작일 |
| `edate` | string | - | 종료일 |

**응답 예시**
```json
{
  "count": 15,
  "records": [
    { "holiday_id": "B48E91BB...", "holiday_date": "2026-01-01", "holiday_name": "1월1일", "public_yn": "Y", "deduct_yn": "N" }
  ]
}
```

**예시**
```
GET /api/holidays?year=2026
GET /api/holidays?sdate=2026-04-01&edate=2026-04-30
```

---

## 부서

### 부서 목록 조회 (flat)
```
GET /api/departments
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `parent` | string | - | 직속 부모 코드 (직속 자식만 반환) |
| `level` | integer | - | 레벨 필터 (1=회사, 2=그룹, 3=팀, 4=파트) |
| `root` | string | - | 해당 부서 하위 전체 반환 (코드) |
| `name` | string | - | 부서명 부분 일치 검색 |

`path`는 recursive CTE로 동적 계산됩니다 (`00-0009-A00000022` 형식).

**응답 예시**
```json
{
  "count": 3,
  "records": [
    { "code": "0009",      "name": "구독그룹", "level": 2, "parent": "00",   "path": "00-0009" },
    { "code": "000906",    "name": "구독1팀",  "level": 3, "parent": "0009", "path": "00-0009-000906" },
    { "code": "A00000022", "name": "구독6팀",  "level": 3, "parent": "0009", "path": "00-0009-A00000022" }
  ]
}
```

**예시**
```
GET /api/departments                    → 전체 flat
GET /api/departments?parent=0009        → 구독그룹 직속 팀만
GET /api/departments?root=0009          → 구독그룹 하위 전체
GET /api/departments?level=4            → 파트급 전체
GET /api/departments?name=구독           → 이름에 '구독' 포함된 부서
```

---

### 부서 계층 트리 조회
```
GET /api/departments/tree
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `root` | string | - | 시작 부서 코드 (생략 시 전체 트리) |
| `root_name` | string | - | 시작 부서명 부분 일치 (코드 대신 사용 가능) |

**응답 예시**
```json
[
  {
    "code": "0009", "name": "구독그룹", "level": 2, "parent": "00", "path": "00-0009",
    "children": [
      { "code": "000906",    "name": "구독1팀", "level": 3, "parent": "0009", "path": "00-0009-000906",    "children": [] },
      { "code": "A00000022", "name": "구독6팀", "level": 3, "parent": "0009", "path": "00-0009-A00000022", "children": [] }
    ]
  }
]
```

**예시**
```
GET /api/departments/tree                      → 전체 트리
GET /api/departments/tree?root=0009            → 구독그룹 트리 (코드)
GET /api/departments/tree?root_name=구독그룹    → 구독그룹 트리 (이름)
```

---

## 출퇴근

### 오늘 출퇴근 현황
```
GET /api/commute/today
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `dept_id` | string | - | 부서 코드 필터 |

**응답 예시**
```json
{
  "date": "2026-04-24",
  "count": 6,
  "records": [
    {
      "dept_id": "0009",
      "name": "오찬열",
      "work_date": "2026-04-24",
      "scheduled_start_time": "09:00:00",
      "actual_start_time": "08:38:50",
      "actual_end_time": null,
      "is_late": false,
      "is_absent": false,
      "start_device_name": "APP",
      "time_unit": null,
      "time_unit_name": null,
      "vac_stime": null,
      "vac_etime": null,
      "synced_at": "2026-04-24T08:40:00.000Z"
    }
  ]
}
```

**예시**
```
GET /api/commute/today
GET /api/commute/today?dept_id=0009
```

---

### 미출근자 조회
```
GET /api/commute/absent
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `date` | string | - | 날짜 `YYYY-MM-DD` (기본: 오늘) |
| `dept_id` | string | - | 부서 코드 필터 |

주말/공휴일/종일휴가자는 자동 제외됩니다.

**응답 예시**
```json
{
  "date": "2026-04-24",
  "count": 2,
  "records": [
    {
      "dept_id": "0009", "name": "홍길동",
      "scheduled_start_time": "09:00:00",
      "time_unit": null, "vac_etime": null,
      "synced_at": "2026-04-24T09:10:00.000Z"
    }
  ]
}
```

공휴일인 경우:
```json
{ "date": "2026-05-05", "is_holiday": true, "holiday_name": "어린이날", "count": 0, "records": [] }
```

주말인 경우:
```json
{ "date": "2026-04-25", "is_weekend": true, "count": 0, "records": [] }
```

**예시**
```
GET /api/commute/absent
GET /api/commute/absent?date=2026-04-23
GET /api/commute/absent?dept_id=0009
```

---

### 기간별 출퇴근 조회
```
GET /api/commute
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `sdate` | string | ✅ | 시작일 `YYYY-MM-DD` |
| `edate` | string | ✅ | 종료일 `YYYY-MM-DD` |
| `dept_id` | string | - | 부서 코드 필터 |
| `name` | string | - | 이름 필터 (부분 일치) |

**응답 예시**
```json
{
  "sdate": "2026-04-01",
  "edate": "2026-04-30",
  "count": 120,
  "records": [
    {
      "dept_id": "0009",
      "name": "오찬열",
      "work_date": "2026-04-24",
      "scheduled_start_time": "09:00:00",
      "scheduled_end_time": "18:00:00",
      "actual_start_time": "08:38:50",
      "actual_end_time": "18:00:00",
      "work_minutes": 480,
      "break_minutes": 60,
      "is_late": false,
      "is_early_leave": false,
      "is_absent": false,
      "start_place_name": "에땅빌딩",
      "start_device_name": "APP",
      "end_device_name": "자동",
      "time_unit": null,
      "time_unit_name": null,
      "vac_sdate": null,
      "vac_edate": null,
      "vac_stime": null,
      "vac_etime": null
    }
  ]
}
```

**예시**
```
GET /api/commute?sdate=2026-04-01&edate=2026-04-30
GET /api/commute?sdate=2026-04-01&edate=2026-04-30&dept_id=0009
GET /api/commute?sdate=2026-04-01&edate=2026-04-30&name=오찬열
```

---

## 휴가

### 휴가 조회
```
GET /api/vacations
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `sdate` | string | - | 시작일 `YYYY-MM-DD` (기본: 오늘) |
| `edate` | string | - | 종료일 `YYYY-MM-DD` (기본: 오늘) |
| `name` | string | - | 이름 필터 (부분 일치) |
| `dept` | string | - | 부서명 필터 (부분 일치) |

> 해당 기간과 **겹치는** 휴가를 모두 반환합니다.

**응답 예시**
```json
{
  "sdate": "2026-04-24",
  "edate": "2026-04-24",
  "count": 2,
  "records": [
    {
      "us_name": "오찬열",
      "dept_name": "구독6팀",
      "time_unit_name": "종일",
      "use_time_type_name": null,
      "use_sdate": "2026-04-24",
      "use_edate": "2026-04-24",
      "use_stime": null,
      "use_etime": null,
      "synced_at": "2026-04-24T00:10:00.000Z"
    }
  ]
}
```

**예시**
```
GET /api/vacations
GET /api/vacations?sdate=2026-04-01&edate=2026-04-30
GET /api/vacations?sdate=2026-04-24&edate=2026-04-30&dept=구독6팀
GET /api/vacations?name=오찬열
```

---

## 회의실

### 회의실 예약 조회
```
GET /api/rooms
```

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `sdate` | string | - | 시작일 `YYYY-MM-DD` (기본: 오늘) |
| `edate` | string | - | 종료일 `YYYY-MM-DD` (기본: 오늘) |

**응답 예시**
```json
{
  "sdate": "2026-04-24",
  "edate": "2026-04-24",
  "count": 3,
  "records": [
    {
      "room_name": "중회의실(에땅)",
      "title": "주간 스프린트",
      "booker": "오찬열",
      "book_date": "2026-04-24",
      "start_time": "2026-04-24T10:00:00.000Z",
      "end_time": "2026-04-24T11:00:00.000Z"
    }
  ]
}
```

**예시**
```
GET /api/rooms
GET /api/rooms?sdate=2026-04-24&edate=2026-04-25
```

---

## 관리

### 헬스체크
```
GET /api/health
```

```json
{ "ok": true, "time": "2026-04-24T05:00:00.000Z" }
```

---

### 수동 동기화
```
POST /api/sync
```

휴가·회의실·출퇴근 데이터를 즉시 수집합니다. (크론 주기: 10분)

```json
{ "ok": true, "message": "동기화 시작" }
```

---

### 수동 HR 배치
```
POST /api/hr-batch
```

인사정보를 즉시 수집하고 입사/퇴사/변동을 감지합니다. (크론 주기: 매일 01:00 KST)

```json
{ "ok": true, "message": "HR 배치 시작" }
```

---

### 출퇴근 전체 백필
```
POST /api/backfill-commute
```

이번 달 1일부터 오늘까지 출퇴근 데이터를 전부 재수집합니다. 스키마 변경 후 기존 레코드 백필 시 사용합니다.

```json
{ "ok": true, "message": "출퇴근 백필 시작 (2026-04-01~2026-04-27)" }
```

---

## 크론 스케줄

| 작업 | 주기 | 설명 |
|------|------|------|
| syncAll | 매 10분 | 휴가·회의실·출퇴근 수집 |
| runHrBatch | 매일 01:00 KST | 인사정보 수집 및 변동 감지 |
| keepSessions | 매 30분 | AVS·GW 세션 유지 |
| backfill | 매일 02:00 KST | 이번 달 출퇴근 전체 재동기화 (누락 방지) |
