# Slack 알림 봇 PostgreSQL 마이그레이션 기획안

## 1. 개요
현재 JSON 파일 시스템(`data/*.js`)으로 관리되는 데이터를 PostgreSQL 기반으로 전환하여 데이터 안정성을 확보하고, 외부 사내 시스템과의 API 연동(DB 직접 접근 또는 서버 API)을 위한 확장 기반을 마련한다.

---

## 2. 인프라 구성 (Docker)

Docker Compose를 확장하여 DB 컨테이너를 추가하고 영구 저장소를 확보한다.

### docker-compose.yml 제안
```yaml
services:
  slack-bot:
    build: .
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://slack_user:slack_pass@db:5432/slack_db

  db:
    image: postgres:15-alpine
    container_name: slack-db
    environment:
      - POSTGRES_USER=slack_user
      - POSTGRES_PASSWORD=slack_pass
      - POSTGRES_DB=slack_db
    volumes:
      - ./postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped
```

---

## 3. 데이터베이스 스키마 설계

### 3-1. `teams` (팀 및 알림 채널 관리)
| 컬럼명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `id` | SERIAL (PK) | 고유 번호 |
| `dept_id` | VARCHAR(20) | 유니포스트 부서 코드 (예: 0009) |
| `team_names` | TEXT[] | 해당 웹훅을 공유하는 팀명 배열 (JSON의 teams) |
| `webhook_url` | TEXT | Slack Webhook URL |
| `channel_id` | VARCHAR(50) | Slack 채널 ID |
| `notify_settings` | JSONB | 알림 유형별 ON/OFF (vacationDaily, roomChange 등) |
| `is_enabled` | BOOLEAN | 전체 활성화 여부 |

### 3-2. `members` (멤버 및 개인 설정 관리)
| 컬럼명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `slack_id` | VARCHAR(50) (PK) | Slack User ID |
| `name` | VARCHAR(50) | 이름 |
| `dept_id` | VARCHAR(20) | 부서 코드 |
| `team_name` | VARCHAR(100) | 팀명 |
| `is_leader` | BOOLEAN | 팀장 여부 (월말 리포트 수신) |
| `notify_commute` | BOOLEAN | 출근 알림 수신 여부 |
| `notify_vacation` | BOOLEAN | 휴가 알림 포함 여부 |

### 3-3. `cron_settings` (스케줄 관리)
| 컬럼명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `task_id` | VARCHAR(50) (PK) | 작업 ID (sync, vacationWeekly 등) |
| `label` | VARCHAR(100) | 작업 명칭 |
| `schedule` | VARCHAR(50) | 크론 표현식 |
| `is_enabled` | BOOLEAN | 활성화 상태 |

---

## 4. 외부 시스템 연동 (API 확장 기획)

타 사내 시스템에서 활용할 수 있도록 익스프레스 서버에 다음 API 엔드포인트를 기획한다.

### 4-1. 공통 데이터 API
- `GET /api/external/members`: 전체 멤버 및 Slack ID 매핑 정보 제공
- `GET /api/external/teams`: 부서별 웹훅 설정 및 알림 상태 제공

### 4-2. 관리자 연동 API
- `POST /api/external/members/sync`: 인사 시스템 등에서 멤버 정보를 동기화
- `PATCH /api/external/teams/:id`: 외부 관리 도구에서 알림 설정 제어

---

## 5. 단계별 전환 전략 (소스 수정 제외)

1. **DB 환경 구축**: Docker Compose를 이용해 PostgreSQL 컨테이너 기동 및 스키마 생성.
2. **데이터 마이그레이션 도구 작성**: 기존 JSON 파일을 읽어 DB에 `UPSERT` 하는 일회성 스크립트 실행.
3. **서버 아키텍처 리팩토링 설계**:
   - `fs.readFileSync` 로직을 담당하는 `DataRepository` 클래스 설계.
   - DB 연결 및 쿼리를 처리할 클라이언트(Sequelize 또는 pg) 도입 계획 수립.
4. **API 검증**: 신규 DB 기반으로 API 응답이 기존 JSON 데이터와 일치하는지 검증.

---

## 6. 기대 효과
- **데이터 통합**: 여러 프로젝트에서 동일한 PostgreSQL DB를 참조하여 일관된 멤버/팀 데이터 유지.
- **성능 향상**: 대규모 스냅샷 데이터(`snapshot.json`) 처리 시 파일 I/O 대신 DB 인덱스 활용 가능.
- **관리 편의성**: JSON 파일을 직접 수정하는 대신 외부 관리 툴(Admin UI)을 통한 운영 가능.
