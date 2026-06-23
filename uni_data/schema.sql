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

  time_unit            VARCHAR(20),                -- timeUnit (FULL/HOUR)
  time_unit_name       VARCHAR(30),                -- timeUnitName (종일/오전반차 등)
  vac_sdate            DATE,                       -- useSdate
  vac_edate            DATE,                       -- useEdate
  vac_stime            VARCHAR(10),                -- useStime "0900"
  vac_etime            VARCHAR(10),                -- useEtime "1100"

  synced_at            TIMESTAMPTZ  DEFAULT NOW(),

  UNIQUE (dept_id, name, work_date)
);

ALTER TABLE commute_records
  ADD COLUMN IF NOT EXISTS time_unit      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS time_unit_name VARCHAR(30),
  ADD COLUMN IF NOT EXISTS vac_sdate      DATE,
  ADD COLUMN IF NOT EXISTS vac_edate      DATE,
  ADD COLUMN IF NOT EXISTS vac_stime      VARCHAR(10),
  ADD COLUMN IF NOT EXISTS vac_etime      VARCHAR(10);

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
-- 8. ip_teams (IP 관리 - 팀/범위)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS ip_teams (
  id      VARCHAR(10)  PRIMARY KEY,
  name    VARCHAR(100) NOT NULL,
  prefix  VARCHAR(20)  NOT NULL DEFAULT '192.168.12',
  startRange   INTEGER      NOT NULL,
  endRange     INTEGER      NOT NULL,
  color   VARCHAR(20)  DEFAULT ''
);

INSERT INTO ip_teams (id, name, prefix, startRange, endRange, color) VALUES
  ('t1', '1팀',  '192.168.12', 1,   50,  '#3fb950'),
  ('t2', '2팀',  '192.168.12', 51,  100, '#58a6ff'),
  ('t3', '3팀',  '192.168.12', 101, 150, '#bc8cff'),
  ('t4', '4팀',  '192.168.12', 151, 200, '#d29922'),
  ('t5', '기타', '192.168.12', 201, 250, '#f85149')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, prefix=EXCLUDED.prefix,
  startRange=EXCLUDED.startRange, endRange=EXCLUDED.endRange, color=EXCLUDED.color;

-- ----------------------------------------------------------
-- 9. ip_addresses (IP 관리 - IP 레코드)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS ip_addresses (
  id         VARCHAR(10)  PRIMARY KEY,
  ip         VARCHAR(20)  NOT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'free',   -- used/reserved/off/free
  name       VARCHAR(200) DEFAULT '',
  device     VARCHAR(100) DEFAULT '',
  mac        VARCHAR(50)  DEFAULT '',
  memo       TEXT         DEFAULT '',
  date       DATE,
  team_id    VARCHAR(10)  REFERENCES ip_teams(id),
  updated_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_addresses_ip     ON ip_addresses (ip);
CREATE INDEX IF NOT EXISTS idx_ip_addresses_status ON ip_addresses (status);
CREATE INDEX IF NOT EXISTS idx_ip_addresses_team   ON ip_addresses (team_id);

INSERT INTO ip_addresses (id, ip, status, name, device, mac, memo, date, team_id) VALUES
  ('941d','192.168.12.11', 'off',  '대원제약',           '',           '',               'daewon',                   '2026-04-23','t1'),
  ('58a9','192.168.12.12', 'off',  '디앤에이모터스',     '',           '',               'dnamotors',                '2026-04-23','t1'),
  ('6dde','192.168.12.13', 'off',  'boryung',            'Windows Server','00155D0B081C','Hyper-V Auto Sync',         '2026-04-23','t1'),
  ('8967','192.168.12.14', 'off',  '스타벅스커피코리아', '',           '00155D0B0812',   'starbucks',                '2026-04-23','t1'),
  ('d5df','192.168.12.15', 'off',  '시몬느',             '',           '',               'simone',                   '2026-04-23','t1'),
  ('0696','192.168.12.16', 'used', '신세계까사',          '',           '00155D0B0829',   'casamia',                  '2026-04-23','t1'),
  ('35c8','192.168.12.17', 'used', '신세계푸드',          '',           '00155D0B0836',   'shinsegae-food',           '2026-04-23','t1'),
  ('cb02','192.168.12.18', 'off',  '아주스틸',            '',           '',               'aju-steel',                '2026-04-23','t1'),
  ('ac1f','192.168.12.19', 'off',  '에이블씨엔씨',        '',           '00155D010838',   'able-cnc',                 '2026-04-23','t1'),
  ('16d2','192.168.12.20', 'off',  '유니드 / 유니드비티플러스','',      '',               'unid / unidbtplus',        '2026-04-23','t1'),
  ('65b4','192.168.12.21', 'used', 'ubase',              'Windows Server','00155D0B0811','Hyper-V Auto Sync',         '2026-04-23','t1'),
  ('67ad','192.168.12.22', 'off',  '유비쿼스',            '',           '00155D0B0842',   'ubiquoss',                 '2026-04-23','t1'),
  ('69c3','192.168.12.23', 'off',  '일진글로벌',          '',           '',               'iljin',                    '2026-04-23','t1'),
  ('4823','192.168.12.24', 'off',  '제테마',              '',           '00155D0B0825',   'jetema',                   '2026-04-23','t1'),
  ('e2a8','192.168.12.25', 'off',  '폴리미래',            '',           '',               'polymirae',                '2026-04-23','t1'),
  ('7e17','192.168.12.28', 'off',  '휴니드테크놀러지스',  '',           '',               'huneed',                   '2026-04-23','t1'),
  ('e515','192.168.12.29', 'off',  '직방',                '',           '',               'zigbang',                  '2026-04-23','t1'),
  ('5338','192.168.12.30', 'used', 'pharmaresearch',     'Windows Server','00155D0B0815','Hyper-V Auto Sync',         '2026-04-23','t1'),
  ('8f4c','192.168.12.32', 'used', '에이치엠엠',          'HyperV',     '00-15-5D-0B-13-54','hmm / host:hmm / hv:192.168.11.8','2026-04-23','t1'),
  ('6e97','192.168.12.34', 'off',  '42dot',              'Windows Server','00155D0B0818','Hyper-V Auto Sync',         '2026-04-23','t1'),
  ('ac6f','192.168.12.35', 'off',  '피에스케이 / 에이치엠엠','HyperV', '00-15-5D-01-08-89','psk / host:local-psk / hv:192.168.11.8 / hmm / hv:192.168.11.8','2026-04-23','t1'),
  ('280e','192.168.12.40', 'used', 'ckdpharm',           'Windows Server','00155D0B0810','Hyper-V Auto Sync',         '2026-04-23','t1'),
  ('0c2e','192.168.12.51', 'off',  '경창산업',            'HyperV',     '00-15-5D-01-08-21','kyungchang / host:local-kyungchang / hv:192.168.11.8','2026-04-23','t2'),
  ('6bb7','192.168.12.52', 'off',  '금화정수',            'HyperV',     '00-15-5D-01-08-75','geumhwa / host:local-geumhwa / hv:192.168.11.8','2026-04-23','t2'),
  ('da70','192.168.12.53', 'off',  '녹십자',              'HyperV',     '00-15-5D-01-08-67','greencross / host:local-gc / hv:192.168.11.8','2026-04-23','t2'),
  ('c7a7','192.168.12.55', 'off',  '대동공업',            'HyperV',     '00-15-5D-00-C0-24','daedong / host:local-daedong / hv:192.168.11.8','2026-04-23','t2'),
  ('e41b','192.168.12.56', 'off',  '매그나칩반도체',      'HyperV',     '00-15-5D-00-C0-18','magnachip / host:local-magnachip / hv:192.168.11.8','2026-04-23','t2'),
  ('2b11','192.168.12.57', 'off',  '매그나칩반도체',      'HyperV',     '00-15-5D-01-08-6C','magnachip / host:local-magnachip2 / hv:192.168.11.8','2026-04-23','t2'),
  ('4960','192.168.12.58', 'used', '무신사',              'HyperV',     '00-15-5D-00-C0-26','musinsa / host:local-musinsa / hv:192.168.11.8','2026-04-23','t2'),
  ('d510','192.168.12.59', 'off',  '삼익티에치케이',      '',           '00155D0B0824',   'samickthk',                '2026-04-23','t2'),
  ('5959','192.168.12.60', 'off',  '세아제강',            'HyperV',     '00-15-5D-01-08-62','seah / host:local-seah / hv:192.168.11.8','2026-04-23','t2'),
  ('2d59','192.168.12.61', 'off',  '솔브레인',            'HyperV',     '00-15-5D-01-08-32','soulbrain / host:local-soulbrain / hv:192.168.11.8','2026-04-23','t2'),
  ('351a','192.168.12.62', 'off',  '에코비트',            'HyperV',     '00-15-5D-01-08-15','ecobit / host:local-tsk / hv:192.168.11.8','2026-04-23','t2'),
  ('6e53','192.168.12.63', 'off',  '오뚜기',              'HyperV',     '00-15-5D-01-08-3B','ottogi / host:local-ottogi / hv:192.168.11.8','2026-04-23','t2'),
  ('7809','192.168.12.64', 'off',  '와이지원',            'HyperV',     '00-15-5D-01-08-3E','yg1 / host:local-yg1 / hv:192.168.11.8','2026-04-23','t2'),
  ('3c81','192.168.12.65', 'used', '유한양행',            'HyperV',     '00-15-5D-01-08-56','yuhan / host:local-yuhan / hv:192.168.11.8','2026-04-23','t2'),
  ('b66e','192.168.12.66', 'off',  '이원',                'HyperV',     '00-15-5D-01-08-0B','e1 / host:local-e1 / hv:192.168.11.8','2026-04-23','t2'),
  ('2559','192.168.12.67', 'off',  '영원아웃도어',        'HyperV',     '00-15-5D-01-08-7E','youngone-outdoor / host:local-youngone-outdoor / hv:192.168.11.8','2026-04-23','t2'),
  ('6dea','192.168.12.68', 'off',  '여천NCC',             'HyperV',     '00-15-5D-0B-08-37','yncc / host:local-yncc / hv:192.168.11.8','2026-04-23','t2'),
  ('e2ee','192.168.12.69', 'off',  '캐논코리아',          'HyperV',     '00-15-5D-01-08-7B','canon / host:local-canon / hv:192.168.11.8','2026-04-23','t2'),
  ('b5f5','192.168.12.71', 'off',  '토니모리',            'HyperV',     '00-15-5D-01-08-2D','tonymoly / host:local-tonymoly / hv:192.168.11.8','2026-04-23','t2'),
  ('e971','192.168.12.72', 'off',  '티시스',              'HyperV',     '00-15-5D-01-08-13','tsis / host:local-tsis / hv:192.168.11.8','2026-04-23','t2'),
  ('409a','192.168.12.73', 'used', '풍산',                'HyperV',     '00-15-5D-01-08-5E','poongsan / host:local-poongsan / hv:192.168.11.8','2026-04-23','t2'),
  ('5c9a','192.168.12.74', 'off',  '피아이첨단소재',      'HyperV',     '00-15-5D-01-08-5C','pimaterials / host:local-pimaterials / hv:192.168.11.8','2026-04-23','t2'),
  ('ddc0','192.168.12.75', 'used', '한온시스템',          'HyperV',     '00-15-5D-01-08-58','hanon / host:local-hanon / hv:192.168.11.8','2026-04-23','t2'),
  ('a41d','192.168.12.76', 'used', '한화솔루션케미칼부문','HyperV',     '00-15-5D-00-17-5C','hanwha-hcc / host:local-hanwhahcc / hv:192.168.11.8','2026-04-23','t2'),
  ('80ea','192.168.12.77', 'off',  '한화솔루션큐에너지',  'HyperV',     '00-15-5D-01-08-7A','hanwha-qenergy / host:local-hanwha-qenergy / hv:192.168.11.8','2026-04-23','t2'),
  ('9c09','192.168.12.78', 'off',  '한화임팩트',          'HyperV',     '00-15-5D-00-C0-22','hanwha-impact / host:local-hanwha-impact / hv:192.168.11.8','2026-04-23','t2'),
  ('56b6','192.168.12.79', 'off',  '롯데알미늄',          'HyperV',     '00-15-5D-01-08-7F','lotteal / host:local-lotteal / hv:192.168.11.8','2026-04-23','t2'),
  ('391a','192.168.12.80', 'off',  '영원무역',            'HyperV',     '00-15-5D-00-C0-36','youngone / host:local-youngone / hv:192.168.11.8','2026-04-23','t2'),
  ('50c4','192.168.12.81', 'off',  '녹십자',              '노트북',     'BC-54-2F-D0-7C-08','greencross / host:1100PN0109',  '2026-04-23','t2'),
  ('f74f','192.168.12.82', 'off',  '한화큐셀',            'HyperV',     '00-15-5D-01-08-8B','hanwha-qcells / host:local-hanwha-qcells / hv:192.168.11.8','2026-04-23','t2'),
  ('b869','192.168.12.83', 'used', '한화인사이트',        'HyperV',     '00-15-5D-01-08-8E','hanwha-insight / host:local-hanwha-insight / hv:192.168.11.8','2026-04-23','t2'),
  ('f45a','192.168.12.84', 'off',  '코스알엑스',          '노트북',     '00-15-5D-00-C0-3C','COSRX / host:local-cosrx',       '2026-04-23','t2'),
  ('7341','192.168.12.85', 'used', '바디프랜드',          'HyperV',     '00-15-5D-01-08-94','bodyfriend / host:local-bodyfriend / hv:192.168.11.8','2026-04-23','t2'),
  ('f80b','192.168.12.86', 'off',  '넥센타이어',          'HyperV',     '00-15-5D-00-C0-3E','nexentire / host:local-nexentire / hv:192.168.11.8','2026-04-23','t2'),
  ('a06c','192.168.12.98', 'used', '씨앤씨인터내셔널',    'HyperV',     '00-15-5D-0B-08-46','cncinternational / host:local-cncinter / hv:192.168.11.8','2026-04-23','t2'),
  ('7c5a','192.168.12.99', 'off',  '케이티앤지',          'HyperV',     '',               'ktng / host:local-ktng / hv:192.168.11.8','2026-04-23','t2'),
  ('d814','192.168.12.101','off',  '엘에스네트웍스',      '',           '00155D0B132A',   'lsnetworks',               '2026-04-23','t3'),
  ('0775','192.168.12.102','used', '경동그룹',            '',           '00-09-0F-FE-00-01','kyoungdong',              '2026-04-23','t3'),
  ('db31','192.168.12.103','off',  '경보제약',            '',           '00155D0B135C',   'kyoungbo',                 '2026-04-23','t3'),
  ('59b8','192.168.12.104','off',  '광동제약',            '',           '',               'kwangdong',                '2026-04-23','t3'),
  ('71b0','192.168.12.105','off',  '남해화학',            '',           '',               'nhchem',                   '2026-04-23','t3'),
  ('887d','192.168.12.106','used', '동화기업',            '',           '00155D0B1323',   'dongwha',                  '2026-04-23','t3'),
  ('3005','192.168.12.107','off',  '디엘케미칼',          '',           '00155D0B1329',   'daelim',                   '2026-04-23','t3'),
  ('c1b7','192.168.12.108','off',  '락앤락',              '',           '',               'locknlock',                '2026-04-23','t3'),
  ('eedf','192.168.12.109','off',  '메디톡스',            '',           '',               'medytox',                  '2026-04-23','t3'),
  ('6242','192.168.12.110','off',  '세방기업',            '',           '',               'sebang',                   '2026-04-23','t3'),
  ('74c2','192.168.12.111','off',  '슈피겐코리아',        '',           '00155D0B1331',   'spigen',                   '2026-04-23','t3'),
  ('e1f1','192.168.12.112','off',  '심팩',                '',           '00155D0B1386',   'simpac',                   '2026-04-23','t3'),
  ('7ec3','192.168.12.113','used', '애터미',              '',           '00155D0B133B',   'atomy',                    '2026-04-23','t3'),
  ('e322','192.168.12.114','off',  '어프로티움',          '',           '00155D0B135D',   'approtium',                '2026-04-23','t3'),
  ('8d89','192.168.12.115','off',  '에넥스',              '',           '',               'enex',                     '2026-04-23','t3'),
  ('1d6d','192.168.12.117','off',  '와이솔',              '',           '',               'wisol',                    '2026-04-23','t3'),
  ('4761','192.168.12.118','off',  '울산피피',            '',           '',               'upp',                      '2026-04-23','t3'),
  ('8b1d','192.168.12.119','off',  '텔레칩스',            '',           '',               'telechips',                '2026-04-23','t3'),
  ('0d4a','192.168.12.120','off',  '한국콜마',            'HyperV',     '',               'kolmar / hv:192.168.11.9', '2026-04-23','t3'),
  ('dd64','192.168.12.121','off',  '해양에너지',          '',           '',               'hyenergy',                 '2026-04-23','t3'),
  ('1477','192.168.12.122','used', '이지스자산운용',      '',           '00155D0B1383',   'igis',                     '2026-04-23','t3'),
  ('b08b','192.168.12.123','off',  '제주항공',            'HyperV',     '00-15-5D-01-08-8C','jejuair / host:local-jejuair / hv:192.168.11.9','2026-04-23','t3'),
  ('0f71','192.168.12.124','off',  '애경케미칼',          'HyperV',     '00-15-5D-01-08-92','aekyungchemical / host:local-aekyungchem / hv:192.168.11.9','2026-04-23','t3'),
  ('a830','192.168.12.125','used', '에어인천',            'HyperV',     '00-15-5D-01-08-93','airincheon / host:local-airincheon / hv:192.168.11.9','2026-04-23','t3'),
  ('e427','192.168.12.126','off',  '버킷플레이스',        'HyperV',     '00-15-5D-01-08-97','bucketplace / host:local-bucketplace / hv:192.168.11.9','2026-04-23','t3'),
  ('b56c','192.168.12.127','off',  '매일유업',            'HyperV',     '00-15-5D-01-08-99','maeil / host:local-maeil / hv:192.168.11.9','2026-04-23','t3'),
  ('4c4f','192.168.12.128','used', '서흥',                'HyperV',     '00-15-5D-0B-13-6A','suheung / host:local-suheung / hv:192.168.11.9','2026-04-23','t3'),
  ('e32f','192.168.12.129','off',  '현대코퍼레이션',      'HyperV',     '00-15-5D-0B-13-74','hyundaicorp / host:local-hyundaicorp / hv:192.168.11.9','2026-04-23','t3'),
  ('00a6','192.168.12.145','off',  '린데코리아',          '',           '',               'linde',                    '2026-04-23','t3'),
  ('2d4b','192.168.12.146','off',  '현대제철',            '',           '00155D0B137A',   'hyundai-steel',            '2026-04-23','t3'),
  ('206b','192.168.12.147','used', 'hyundai_steel2',      'Windows Server','00155D0B1310','Hyper-V Auto Sync',         '2026-04-23','t3'),
  ('91df','192.168.12.151','used', '네오팜 / 잇츠한불',   'HyperV',     '00-15-5D-01-08-4E','neopharm / host:local-itshanbul / hv:192.168.11.9 / itshanbul / host:local-itshanbul / hv:192.168.11.9','2026-04-23','t4'),
  ('fc7d','192.168.12.152','off',  '버거킹',              'HyperV',     '00-15-5D-01-08-07','burgerking / host:local-burgerking / hv:192.168.11.9','2026-04-23','t4'),
  ('3a58','192.168.12.153','off',  '십일번가',            'HyperV',     '00-15-5D-01-08-03','11st / host:local-11st / hv:192.168.11.9','2026-04-23','t4'),
  ('e16b','192.168.12.154','off',  '안국약품',            'HyperV',     '',               'ahngook / hv:192.168.11.9','2026-04-23','t4'),
  ('d5e5','192.168.12.155','off',  '에센코어',            'HyperV',     '00-15-5D-01-08-16','essencore / host:local-essencore / hv:192.168.11.9','2026-04-23','t4'),
  ('25cd','192.168.12.157','off',  '에스케이네트웍스',    '노트북',     'AA-AA-AA-AA-AA-AA','sk-networks / host:김재현',  '2026-04-23','t4'),
  ('3959','192.168.12.158','used', '에스케이머티리얼즈에어플러스 / 에스케이지포틴 / 에스케이스페셜티 / 에스케이트리켐','HyperV','00-15-5D-00-C0-17','sk-airplus / host:local-skmaterials / hv:192.168.11.9 / sk-g14 / host:local-skmaterials / hv:192.168.11.9 / sk-specialt / host:local-skmaterials / hv:192.168.11.9 / sk-trichem / host:local-skmaterials / hv:192.168.11.9','2026-04-23','t4'),
  ('be11','192.168.12.159','off',  '에스케이바이오텍',    'HyperV',     '00-15-5D-01-08-14','sk-biotek / host:local_sk_biotek / hv:192.168.11.9','2026-04-23','t4'),
  ('55bc','192.168.12.160','off',  '에스케이바이오팜',    'HyperV',     '00-15-5D-0B-13-09','sk-biopharm / host:local-skbiopham / hv:192.168.11.9','2026-04-23','t4'),
  ('a9e9','192.168.12.161','off',  '에스케이스퀘어',      'HyperV',     '00-15-5D-0B-13-21','sk-square / host:local-sksquare / hv:192.168.11.9','2026-04-23','t4'),
  ('273e','192.168.12.164','off',  '에스케이주식회사',    'HyperV',     '00-15-5D-01-08-5D','sk-inc / host:local-sk-inc / hv:192.168.11.9','2026-04-23','t4'),
  ('3fd9','192.168.12.169','used', '에프앤유신용정보 / 버거킹_일본','HyperV','00-15-5D-00-C0-1F','fnu / host:local-fnu / hv:192.168.11.9 / burgerkingjp / host:burgerkingjp / hv:192.168.11.9','2026-04-23','t4'),
  ('59ea','192.168.12.170','off',  '유지피에스',          'HyperV',     '00-15-5D-0B-13-76','ugps / host:local-ugps / hv:192.168.11.9','2026-04-23','t4'),
  ('d8d0','192.168.12.172','used', '키파운드리',          'HyperV',     '00-15-5D-01-08-1C','keyfoundry / host:local-keyfoundry / hv:192.168.11.9','2026-04-23','t4'),
  ('74d8','192.168.12.173','off',  '티맵모빌리티',        'HyperV',     '00-15-5D-01-08-7D','tmap-mobility / host:local-sk-tmap / hv:192.168.11.9','2026-04-23','t4'),
  ('7db8','192.168.12.174','off',  '패스트파이브',        'HyperV',     '00-15-5D-0B-13-23','fastfive / host:local-fastfive / hv:192.168.11.9','2026-04-23','t4'),
  ('a553','192.168.12.175','off',  '푸디스트',            'HyperV',     '',               'foodist / host:local-foodist / hv:192.168.11.9','2026-04-23','t4'),
  ('5400','192.168.12.176','used', '에이제이네트웍스',    'HyperV',     '00-15-5D-00-C0-37','ajnetworks / host:local-ajnetworks / hv:192.168.11.9','2026-04-23','t4'),
  ('5e14','192.168.12.177','off',  '에스케이네트웍스',    '노트북',     'AA-AA-AA-AA-AA-AA','sk-networks / host:정현주',  '2026-04-23','t4'),
  ('3c20','192.168.12.178','off',  '에스케이플래닛',      'HyperV',     '00-15-5D-00-C0-39','sk-planet / host:local-skplanet / hv:192.168.11.9','2026-04-23','t4'),
  ('f375','192.168.12.179','used', '사조',                'HyperV',     '00-15-5D-00-C0-38','sajo / host:local-sajo / hv:192.168.11.9','2026-04-23','t4'),
  ('7d61','192.168.12.180','used', '에스케이네트웍스 / 에스케이스토아','HyperV','00-15-5D-01-08-87','sk-networks / host:local-sk_networks / hv:192.168.11.9 / sk-stoa / host:local-sk-stoa / hv:192.168.11.9','2026-04-23','t4'),
  ('7030','192.168.12.181','used', '에스피씨',            'HyperV',     '00-15-5D-01-08-90','spc / host:local-spc / hv:192.168.11.9','2026-04-23','t4'),
  ('2c77','192.168.12.182','off',  '에스피씨',            '노트북',     '60-E9-AA-9A-5D-89','spc / host:UNIPOST',          '2026-04-23','t4'),
  ('2660','192.168.12.183','off',  '해성',                'HyperV',     '00-15-5D-01-08-88','haesungds / host:local-haesungds / hv:192.168.11.9','2026-04-23','t4'),
  ('cc64','192.168.12.184','used', '신성이엔지',          'HyperV',     '00-15-5D-01-08-8D','shinsung / host:local-shinsung / hv:192.168.11.9','2026-04-23','t4'),
  ('0090','192.168.12.185','off',  '에스케이시그넷',      'HyperV',     '00-15-5D-00-C0-32','sk-signet / host:local-sk-signet / hv:192.168.11.9','2026-04-23','t4'),
  ('26d0','192.168.12.186','off',  '에스엠엔터테인먼트',  'HyperV',     '00-15-5D-0B-13-22','sment / host:local-sment / hv:192.168.11.9','2026-04-23','t4'),
  ('4285','192.168.12.187','used', '삼양식품',            'HyperV',     '00-15-5D-00-C0-3F','samyangfood / host:local-samyangfood / hv:192.168.11.9','2026-04-23','t4'),
  ('d6ad','192.168.12.188','off',  '쌍용이씨앤이',        'HyperV',     '00-15-5D-0B-13-7F','ssangyongcne / host:local-ssangyong / hv:192.168.11.9','2026-04-23','t4'),
  ('5312','192.168.12.189','used', '에스케이실트론 / 효성티앤에스','HyperV','00-15-5D-0B-13-8A','sk-siltron / host:local-sk-siltron / hv:192.168.11.9 / hyosungtns / host:local-hyosung / hv:192.168.11.9','2026-04-23','t4'),
  ('a494','192.168.12.190','used', '에스케이실트론',      'HyperV',     '00-15-5D-0B-13-8B','sk-siltron / host:local-sk-siltron2 / hv:192.168.11.9','2026-04-23','t4'),
  ('4cf2','192.168.12.192','used', '비렉스테크',          'HyperV',     '00-15-5D-0B-13-94','berextech / host:local-berextech / hv:192.168.11.9','2026-04-23','t4'),
  ('2608','192.168.12.193','used', '비렉스테크',          'HyperV',     '00-15-5D-0B-13-95','berextech / host:local-berextec2 / hv:192.168.11.8','2026-04-23','t4'),
  ('6ae4','192.168.12.198','used', 'mobile',              'Windows Server','00155D0B1392','Hyper-V Auto Sync',         '2026-04-23','t4'),
  ('bfaf','192.168.12.199','used', 'local-prd-ssh',       'Windows Server','00155D0B1304','Hyper-V Auto Sync',         '2026-04-23','t4'),
  ('c5aa','192.168.12.197','off',  'ktng_1',              'Windows Server','00155D0B1381','Hyper-V Auto Sync',         '2026-04-24','t4'),
  ('4c5f','192.168.12.201','off',  '구독웹',              'HyperV',     '00-15-5D-0B-13-92','unipost.web / host:local-mobile / hv:192.168.11.9','2026-04-23','t5'),
  ('2a12','192.168.12.202','off',  '구독웹',              'HyperV',     '00-15-5D-0B-13-92','unipost.web / host:local-mobile2 / hv:192.168.11.8','2026-04-23','t5'),
  ('LrJCtGt','192.168.12.211','off','20서버 리눅스',      '',           '',               '',                         '2026-04-23','t5')
ON CONFLICT (id) DO UPDATE SET
  ip=EXCLUDED.ip, status=EXCLUDED.status, name=EXCLUDED.name,
  device=EXCLUDED.device, mac=EXCLUDED.mac, memo=EXCLUDED.memo,
  date=EXCLUDED.date, team_id=EXCLUDED.team_id, updated_at=NOW();

-- ----------------------------------------------------------
-- 10. holidays (공휴일)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS holidays (
  holiday_id   VARCHAR(50)  PRIMARY KEY,   -- holidayId
  holiday_date DATE         NOT NULL,       -- holidayDate
  holiday_name VARCHAR(100) NOT NULL,       -- holidayName
  public_yn    CHAR(1)      DEFAULT 'Y',    -- publicYn
  deduct_yn    CHAR(1)      DEFAULT 'N',    -- deductYn
  synced_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays (holiday_date);

-- ----------------------------------------------------------
-- 9. departments (부서 조직도)
-- ----------------------------------------------------------
-- 기존 테이블 컬럼명 변경 (code→dept_id, name→dept_name)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='code') THEN
    ALTER TABLE departments RENAME COLUMN code TO dept_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='name') THEN
    ALTER TABLE departments RENAME COLUMN name TO dept_name;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS departments (
  dept_id   VARCHAR(20)  PRIMARY KEY,
  dept_name VARCHAR(100) NOT NULL,
  level     INTEGER      NOT NULL,
  parent    VARCHAR(20)  REFERENCES departments(dept_id)
);

INSERT INTO departments (dept_id, dept_name, level, parent) VALUES
  ('00',          '유니포스트',         1, NULL),
  ('0006',        '전략그룹',           2, '00'),
  ('A00000014',   '솔루션부문',         2, '00'),
  ('0009',        '구독그룹',           2, '00'),
  ('0008',        'BusinessPortal그룹', 2, '00'),
  ('0010',        'SaaS그룹',           2, '00'),
  ('0002',        '기타',               2, '00'),
  ('000601',      '경영기획팀',         3, '0006'),
  ('000602',      '전략영업팀',         3, '0006'),
  ('A00000018',   '회계팀',             3, '0006'),
  ('0011',        '자금팀',             3, '0006'),
  ('A00000004',   '서비스기획팀',       3, '0006'),
  ('A00000005',   'PM그룹',             3, 'A00000014'),
  ('000701',      '솔루션SAP그룹',      3, 'A00000014'),
  ('000702',      '솔루션WEB그룹',      3, 'A00000014'),
  ('000901',      'i-Saas팀',           3, '0009'),
  ('000906',      '구독1팀',            3, '0009'),
  ('000907',      '구독2팀',            3, '0009'),
  ('000908',      '구독3팀',            3, '0009'),
  ('000909',      '구독4팀',            3, '0009'),
  ('A00000020',   '구독5팀',            3, '0009'),
  ('A00000022',   '구독6팀',            3, '0009'),
  ('A00000023',   '구독7팀',            3, '0009'),
  ('A00000011',   'BP PM팀',            3, '0008'),
  ('00080101',    '코어개발팀',         3, '0008'),
  ('000801',      'BP포탈팀',           3, '0008'),
  ('A00000003',   'Saas서비스팀',       3, '0010'),
  ('A00000013',   '전자문서사업팀',     3, '0010'),
  ('A00000002',   '영업팀',             3, '0010'),
  ('A00000015',   '고객성공팀',         3, '0010'),
  ('001001',      'OLD_SaaS팀',         3, '0010'),
  ('A00000016',   '예술Part',           4, '000601'),
  ('A00000024',   '디자인Part',         4, 'A00000004'),
  ('A00000017',   '마케팅Part',         4, 'A00000004'),
  ('000603',      'PM팀',               4, 'A00000005'),
  ('00070101',    'SAP1팀',             4, '000701'),
  ('00070102',    'SAP2팀',             4, '000701'),
  ('A00000006',   'SAP3팀',             4, '000701'),
  ('A00000007',   'SAP4팀',             4, '000701'),
  ('A00000008',   'WEB1팀',             4, '000702'),
  ('A00000009',   'WEB2팀',             4, '000702'),
  ('A00000010',   'WEB3팀',             4, '000702'),
  ('A00000012',   'BP구독Part',         4, '000801')
ON CONFLICT (dept_id) DO UPDATE SET
  dept_name=EXCLUDED.dept_name, level=EXCLUDED.level, parent=EXCLUDED.parent;

CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments (parent);

-- ----------------------------------------------------------
-- 9. room_bookings (회의실 예약)
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
