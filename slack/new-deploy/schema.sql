-- ============================================================
-- 통합 DB 스키마 (192.168.12.211 / unipost_insa)
-- 적용 순서: 1) users ALTER → 2) 신규 테이블 생성
-- ============================================================

-- ----------------------------------------------------------
-- 1. 기존 users 테이블 컬럼 추가 (insa Prisma 스키마 확장)
-- ----------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS us_dept          VARCHAR(50),        -- usDept (A00000022)
  ADD COLUMN IF NOT EXISTS emp_no           VARCHAR(20),        -- empNo (U2509003)
  ADD COLUMN IF NOT EXISTS enter_date       DATE,               -- fEnterDate
  ADD COLUMN IF NOT EXISTS retire_date      DATE,               -- fRetireDate
  ADD COLUMN IF NOT EXISTS us_dept_chief_yn CHAR(1) DEFAULT 'N',-- usDeptChiefYn
  ADD COLUMN IF NOT EXISTS us_use_yn        CHAR(1) DEFAULT 'Y',-- usUseYn
  ADD COLUMN IF NOT EXISTS daily_work_min   INTEGER DEFAULT 480, -- contractedDailyWorkMin
  ADD COLUMN IF NOT EXISTS part_time_yn     CHAR(1) DEFAULT 'N',-- partTimeWorkerYn
  ADD COLUMN IF NOT EXISTS reduced_yn       CHAR(1) DEFAULT 'N',-- reducedScheduleYn
  ADD COLUMN IF NOT EXISTS slack_id         VARCHAR(50),         -- Slack User ID
  ADD COLUMN IF NOT EXISTS is_leader        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_commute   BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_vacation  BOOLEAN DEFAULT true;

-- ----------------------------------------------------------
-- 2. teams (slack bot teams.json)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id              SERIAL PRIMARY KEY,
  dept_id         VARCHAR(20)  NOT NULL DEFAULT '',
  team_names      TEXT[]       NOT NULL,
  webhook_url     TEXT         NOT NULL,
  channel_id      VARCHAR(50)  DEFAULT '',
  notify_settings JSONB        DEFAULT '{}',
  is_enabled      BOOLEAN      DEFAULT true
);

-- ----------------------------------------------------------
-- 3. cron_settings (slack bot settings.json → crons)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS cron_settings (
  task_id      VARCHAR(50) PRIMARY KEY,
  label        VARCHAR(100) NOT NULL,
  schedule     VARCHAR(50)  NOT NULL,
  is_enabled   BOOLEAN      DEFAULT true,
  no_timezone  BOOLEAN      DEFAULT false
);

-- ----------------------------------------------------------
-- 4. app_settings (key-value: slackBotToken 등)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
  key    VARCHAR(100) PRIMARY KEY,
  value  TEXT
);

-- ----------------------------------------------------------
-- 5. snapshots (변동 감지 캐시 - 10분마다 갱신)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS snapshots (
  id            VARCHAR(20) PRIMARY KEY DEFAULT 'main',
  vacation_data JSONB        DEFAULT '{}',
  room_data     JSONB        DEFAULT '{}',
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

INSERT INTO snapshots (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------
-- 6. commute_records (출/퇴근 기록)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS commute_records (
  id                   SERIAL PRIMARY KEY,
  dept_id              VARCHAR(20)  NOT NULL,
  us_id                VARCHAR(50),               -- usId (유니포스트 로그인 ID)
  name                 VARCHAR(50)  NOT NULL,      -- usName
  work_date            DATE         NOT NULL,      -- workDate

  scheduled_start_time TIME,                       -- workStime  "09:00"
  scheduled_end_time   TIME,                       -- workEtime  "18:00"
  actual_start_time    TIME,                       -- workStartTime "08:38:50"
  actual_end_time      TIME,                       -- workEndTime   "18:00:00"

  work_minutes         INTEGER,                    -- workTime  "0800" → 480
  break_minutes        INTEGER,                    -- breakTime "0100" → 60

  is_late              BOOLEAN      DEFAULT false, -- lateYn
  is_early_leave       BOOLEAN      DEFAULT false, -- earlyLeaveYn
  is_absent            BOOLEAN      DEFAULT false, -- absenceYn

  start_place_name     VARCHAR(100),               -- workStartPlaceName
  start_device_name    VARCHAR(50),                -- workStartDeviceName
  end_device_name      VARCHAR(50),                -- workEndDeviceName

  synced_at            TIMESTAMPTZ  DEFAULT NOW(),

  UNIQUE (dept_id, name, work_date)
);

CREATE INDEX IF NOT EXISTS idx_commute_dept_date ON commute_records (dept_id, work_date);
CREATE INDEX IF NOT EXISTS idx_commute_name      ON commute_records (name);

-- ----------------------------------------------------------
-- 7. vacations (휴가 기록)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS vacations (
  id                 SERIAL PRIMARY KEY,
  us_name            VARCHAR(50)  NOT NULL,
  dept_name          VARCHAR(100) NOT NULL DEFAULT '',
  time_unit_name     VARCHAR(20)  NOT NULL DEFAULT '',  -- 종일 / 오전반차 / 오후반차 / 시간
  use_time_type      VARCHAR(50)  NOT NULL DEFAULT '',  -- useTimeType
  use_time_type_name VARCHAR(50),                        -- useTimeTypeName
  use_sdate          DATE         NOT NULL,
  use_edate          DATE,
  use_stime          VARCHAR(10)  NOT NULL DEFAULT '',   -- 시간단위 시작 시각
  use_etime          VARCHAR(10),

  synced_at          TIMESTAMPTZ  DEFAULT NOW(),

  UNIQUE (us_name, dept_name, time_unit_name, use_time_type, use_sdate, use_stime)
);

CREATE INDEX IF NOT EXISTS idx_vacations_date  ON vacations (use_sdate, use_edate);
CREATE INDEX IF NOT EXISTS idx_vacations_name  ON vacations (us_name);

-- ----------------------------------------------------------
-- 8. room_bookings (회의실 예약)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_bookings (
  id          SERIAL PRIMARY KEY,
  booking_id  VARCHAR(100) UNIQUE NOT NULL,  -- GW API 예약 ID
  room_name   VARCHAR(100) NOT NULL,          -- equipName
  title       VARCHAR(200),                    -- 예약 제목
  booker      VARCHAR(50),                     -- reservatUsName
  book_date   DATE         NOT NULL,
  start_time  TIMESTAMPTZ,
  end_time    TIMESTAMPTZ,
  synced_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_date ON room_bookings (book_date);

-- ----------------------------------------------------------
-- 9. deploy_schedules (반영일정 알림)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS deploy_schedules (
  id                  SERIAL PRIMARY KEY,
  deploy_at           TIMESTAMPTZ  NOT NULL,
  ticket_no           VARCHAR(100),
  title               VARCHAR(500) NOT NULL,
  registrant_name     VARCHAR(100) NOT NULL,
  registrant_slack_id VARCHAR(50)  NOT NULL,
  hub_name            VARCHAR(200),
  create_name         VARCHAR(100),
  notify_minutes      INT          DEFAULT 15,     -- 반영 N분 전 알림 (0=없음)
  notified            BOOLEAN      DEFAULT FALSE,  -- 알림 발송 완료
  notified_30         BOOLEAN      DEFAULT FALSE,  -- (레거시)
  notified_15         BOOLEAN      DEFAULT FALSE,  -- (레거시)
  created_at          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deploy_at ON deploy_schedules (deploy_at);
