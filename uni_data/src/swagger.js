const spec = {
  openapi: '3.0.0',
  info: {
    title: 'uni_data API',
    version: '1.0.0',
    description: '유니포스트 사내 데이터 수집 & 조회 API',
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: '인사정보', description: '임직원 인사 데이터' },
    { name: '부서', description: '조직도 및 부서 계층 정보' },
    { name: '공휴일', description: '공휴일 기준 정보' },
    { name: '대시보드', description: '근태 현황판 및 통계' },
    { name: '출퇴근', description: '출퇴근 기록' },
    { name: '휴가', description: '휴가 기록' },
    { name: '회의실', description: '회의실 예약' },
    { name: 'IP 관리', description: 'Hyper-V VM IP 현황 관리 (팀/IP 레코드 CRUD)' },
    { name: '관리', description: '수동 동기화 및 상태 확인' },
  ],
  paths: {

    // ── 인사정보 ───────────────────────────────────────────────
    '/users': {
      get: {
        tags: ['인사정보'],
        summary: '인사 목록 조회',
        parameters: [
          { name: 'dept_id',     in: 'query', schema: { type: 'string' }, description: '부서 코드 (부분 일치, 예: A00000022)' },
          { name: 'dept_name',   in: 'query', schema: { type: 'string' }, description: '부서명 (부분 일치, 예: 구독6팀)' },
          { name: 'name',        in: 'query', schema: { type: 'string' }, description: '이름 (부분 일치)' },
          { name: 'role',        in: 'query', schema: { type: 'string' }, description: '직책 (부분 일치)' },
          { name: 'pos',         in: 'query', schema: { type: 'string' }, description: '직위 (부분 일치, 예: 매니저)' },
          { name: 'active_only', in: 'query', schema: { type: 'boolean', default: true }, description: 'false 시 퇴사자 포함' },
        ],
        responses: {
          200: {
            description: '인사 목록',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } },
          },
        },
      },
    },

    '/users/{usId}': {
      get: {
        tags: ['인사정보'],
        summary: '사용자 단건 조회',
        parameters: [
          { name: 'usId', in: 'path', required: true, schema: { type: 'string' }, description: '유니포스트 로그인 ID (예: chanyeol5)' },
        ],
        responses: {
          200: { description: '사용자 정보', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          404: { description: '사용자 없음' },
        },
      },
    },

    '/history': {
      get: {
        tags: ['인사정보'],
        summary: '인사 변동 이력',
        parameters: [
          { name: 'us_id', in: 'query', schema: { type: 'string' }, description: '특정 사용자 필터' },
          { name: 'type',  in: 'query', schema: { type: 'string', enum: ['JOIN', 'LEAVE', 'DEPT_CHANGE', 'ROLE_CHANGE'] }, description: '변동 유형' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 100, maximum: 500 }, description: '최대 건수' },
        ],
        responses: {
          200: { description: '변동 이력 목록', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/History' } } } } },
        },
      },
    },

    // ── 대시보드 ────────────────────────────────────────────────
    '/dashboard/today': {
      get: {
        tags: ['대시보드'],
        summary: '오늘 근태 현황 (팀원별 출근 상태)',
        parameters: [
          { name: 'date',      in: 'query', schema: { type: 'string', example: '2026-04-27' }, description: '날짜 (기본: 오늘)' },
          { name: 'dept_id',   in: 'query', schema: { type: 'string' }, description: '부서 코드 (정확히 일치)' },
          { name: 'dept_name', in: 'query', schema: { type: 'string' }, description: '부서명 부분 일치 (예: 구독6팀)' },
          { name: 'root',      in: 'query', schema: { type: 'string' }, description: '상위 부서 코드 (하위 전체 포함)' },
        ],
        responses: {
          200: {
            description: '팀원별 근태 현황',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                date:    { type: 'string' },
                count:   { type: 'integer' },
                summary: { type: 'object', example: { 출근: 5, 미출근: 2, 공휴일: 0, 종일휴가: 1, 반차: 1, 미등록: 0 } },
                records: { type: 'array', items: { $ref: '#/components/schemas/DashboardToday' } },
              },
            } } },
          },
        },
      },
    },

    '/dashboard/stats': {
      get: {
        tags: ['대시보드'],
        summary: '기간별 근태 통계 (팀원별)',
        parameters: [
          { name: 'sdate',     in: 'query', required: true, schema: { type: 'string', example: '2026-04-01' } },
          { name: 'edate',     in: 'query', required: true, schema: { type: 'string', example: '2026-04-30' } },
          { name: 'dept_id',   in: 'query', schema: { type: 'string' }, description: '부서 코드' },
          { name: 'dept_name', in: 'query', schema: { type: 'string' }, description: '부서명 부분 일치' },
          { name: 'root',      in: 'query', schema: { type: 'string' }, description: '상위 부서 코드 (하위 전체)' },
          { name: 'name',      in: 'query', schema: { type: 'string' }, description: '이름 필터 (부분 일치)' },
        ],
        responses: {
          200: {
            description: '근태 통계',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                sdate:   { type: 'string' },
                edate:   { type: 'string' },
                count:   { type: 'integer' },
                records: { type: 'array', items: { $ref: '#/components/schemas/DashboardStats' } },
              },
            } } },
          },
          400: { description: 'sdate, edate 필수' },
        },
      },
    },

    '/dashboard/late': {
      get: {
        tags: ['대시보드'],
        summary: '지각자 목록',
        parameters: [
          { name: 'sdate',     in: 'query', schema: { type: 'string', example: '2026-04-01' }, description: '시작일 (기본: 오늘)' },
          { name: 'edate',     in: 'query', schema: { type: 'string', example: '2026-04-30' }, description: '종료일 (기본: 오늘)' },
          { name: 'dept_id',   in: 'query', schema: { type: 'string' } },
          { name: 'dept_name', in: 'query', schema: { type: 'string' }, description: '부서명 부분 일치' },
          { name: 'root',      in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: '지각자 목록',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                sdate:   { type: 'string' },
                edate:   { type: 'string' },
                count:   { type: 'integer' },
                records: { type: 'array', items: {
                  type: 'object',
                  properties: {
                    name:               { type: 'string' },
                    dept_id:            { type: 'string' },
                    work_date:          { type: 'string' },
                    actual_start_time:  { type: 'string', example: '09:15:00' },
                    time_unit_name:     { type: 'string', nullable: true },
                  },
                } },
              },
            } } },
          },
        },
      },
    },

    // ── 공휴일 ─────────────────────────────────────────────────
    '/holidays': {
      get: {
        tags: ['공휴일'],
        summary: '공휴일 조회',
        parameters: [
          { name: 'year',  in: 'query', schema: { type: 'integer', example: 2026 }, description: '연도 (해당 연도 전체)' },
          { name: 'sdate', in: 'query', schema: { type: 'string',  example: '2026-01-01' }, description: '시작일' },
          { name: 'edate', in: 'query', schema: { type: 'string',  example: '2026-12-31' }, description: '종료일' },
        ],
        responses: {
          200: {
            description: '공휴일 목록',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                count:   { type: 'integer' },
                records: { type: 'array', items: { $ref: '#/components/schemas/Holiday' } },
              },
            } } },
          },
        },
      },
    },

    // ── 부서 ───────────────────────────────────────────────────
    '/departments': {
      get: {
        tags: ['부서'],
        summary: '부서 목록 조회 (flat)',
        parameters: [
          { name: 'parent', in: 'query', schema: { type: 'string' }, description: '상위 부서 코드 (직속 자식만)' },
          { name: 'level',  in: 'query', schema: { type: 'integer' }, description: '레벨 필터 (1=회사, 2=그룹, 3=팀, 4=파트)' },
          { name: 'root',   in: 'query', schema: { type: 'string' }, description: '특정 부서 하위 전체 (코드, 예: 0009)' },
          { name: 'name',   in: 'query', schema: { type: 'string' }, description: '부서명 부분 일치 검색 (예: 구독)' },
        ],
        responses: {
          200: {
            description: '부서 목록',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                count:   { type: 'integer' },
                records: { type: 'array', items: { $ref: '#/components/schemas/Department' } },
              },
            } } },
          },
        },
      },
    },

    '/departments/tree': {
      get: {
        tags: ['부서'],
        summary: '부서 계층 트리 조회',
        parameters: [
          { name: 'root',      in: 'query', schema: { type: 'string' }, description: '시작 부서 코드 (생략 시 전체 트리)' },
          { name: 'root_name', in: 'query', schema: { type: 'string' }, description: '시작 부서명 부분 일치 (코드 대신 사용 가능, 예: 구독그룹)' },
        ],
        responses: {
          200: {
            description: '계층형 부서 트리',
            content: { 'application/json': { schema: {
              type: 'array',
              items: { $ref: '#/components/schemas/DepartmentNode' },
            } } },
          },
          404: { description: '부서 코드 없음' },
        },
      },
    },

    // ── 출퇴근 ─────────────────────────────────────────────────
    '/commute/today': {
      get: {
        tags: ['출퇴근'],
        summary: '오늘 출퇴근 전체 현황',
        parameters: [
          { name: 'dept_id', in: 'query', schema: { type: 'string' }, description: '부서 코드 필터' },
        ],
        responses: {
          200: {
            description: '오늘 출퇴근 현황',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                date:    { type: 'string', example: '2026-04-24' },
                count:   { type: 'integer' },
                records: { type: 'array', items: { $ref: '#/components/schemas/CommuteToday' } },
              },
            } } },
          },
        },
      },
    },

    '/commute/absent': {
      get: {
        tags: ['출퇴근'],
        summary: '미출근자 조회 (휴가자 제외)',
        parameters: [
          { name: 'date',    in: 'query', schema: { type: 'string', example: '2026-04-24' }, description: '날짜 (기본: 오늘)' },
          { name: 'dept_id', in: 'query', schema: { type: 'string' }, description: '부서 코드 필터' },
        ],
        responses: {
          200: {
            description: '미출근자 목록',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                date:    { type: 'string' },
                count:   { type: 'integer' },
                records: { type: 'array', items: {
                  type: 'object',
                  properties: {
                    dept_id:               { type: 'string' },
                    name:                  { type: 'string' },
                    scheduled_start_time:  { type: 'string', example: '09:00:00' },
                  },
                } },
              },
            } } },
          },
        },
      },
    },

    '/commute': {
      get: {
        tags: ['출퇴근'],
        summary: '기간별 출퇴근 조회',
        parameters: [
          { name: 'sdate',   in: 'query', required: true,  schema: { type: 'string', example: '2026-04-01' }, description: '시작일' },
          { name: 'edate',   in: 'query', required: true,  schema: { type: 'string', example: '2026-04-30' }, description: '종료일' },
          { name: 'dept_id', in: 'query', schema: { type: 'string' }, description: '부서 코드 필터' },
          { name: 'name',    in: 'query', schema: { type: 'string' }, description: '이름 필터 (부분 일치)' },
        ],
        responses: {
          200: {
            description: '출퇴근 기록 목록',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                sdate:   { type: 'string' },
                edate:   { type: 'string' },
                count:   { type: 'integer' },
                records: { type: 'array', items: { $ref: '#/components/schemas/CommuteRecord' } },
              },
            } } },
          },
          400: { description: 'sdate, edate 필수' },
        },
      },
    },

    // ── 휴가 ───────────────────────────────────────────────────
    '/vacations': {
      get: {
        tags: ['휴가'],
        summary: '휴가 조회 (해당 기간과 겹치는 휴가 반환)',
        parameters: [
          { name: 'sdate', in: 'query', schema: { type: 'string', example: '2026-04-24' }, description: '시작일 (기본: 오늘)' },
          { name: 'edate', in: 'query', schema: { type: 'string', example: '2026-04-30' }, description: '종료일 (기본: 오늘)' },
          { name: 'name',  in: 'query', schema: { type: 'string' }, description: '이름 필터 (부분 일치)' },
          { name: 'dept',  in: 'query', schema: { type: 'string' }, description: '부서명 필터 (부분 일치)' },
        ],
        responses: {
          200: {
            description: '휴가 목록',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                sdate:   { type: 'string' },
                edate:   { type: 'string' },
                count:   { type: 'integer' },
                records: { type: 'array', items: { $ref: '#/components/schemas/Vacation' } },
              },
            } } },
          },
        },
      },
    },

    // ── 회의실 ─────────────────────────────────────────────────
    '/rooms': {
      get: {
        tags: ['회의실'],
        summary: '회의실 예약 조회',
        parameters: [
          { name: 'sdate', in: 'query', schema: { type: 'string', example: '2026-04-24' }, description: '시작일 (기본: 오늘)' },
          { name: 'edate', in: 'query', schema: { type: 'string', example: '2026-04-25' }, description: '종료일 (기본: 오늘)' },
        ],
        responses: {
          200: {
            description: '회의실 예약 목록',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                sdate:   { type: 'string' },
                edate:   { type: 'string' },
                count:   { type: 'integer' },
                records: { type: 'array', items: { $ref: '#/components/schemas/RoomBooking' } },
              },
            } } },
          },
        },
      },
    },

    // ── IP 관리 ────────────────────────────────────────────────
    '/ip/teams': {
      get: {
        tags: ['IP 관리'],
        summary: '팀 목록 조회',
        responses: { 200: { description: '팀 목록', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/IpTeam' } } } } } },
      },
      post: {
        tags: ['IP 관리'],
        summary: '팀 추가',
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/IpTeamBody' } } } },
        responses: { 201: { description: '생성된 팀', content: { 'application/json': { schema: { $ref: '#/components/schemas/IpTeam' } } } } },
      },
    },

    '/ip/teams/{id}': {
      put: {
        tags: ['IP 관리'],
        summary: '팀 수정',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/IpTeamBody' } } } },
        responses: { 200: { description: '수정된 팀', content: { 'application/json': { schema: { $ref: '#/components/schemas/IpTeam' } } } } },
      },
      delete: {
        tags: ['IP 관리'],
        summary: '팀 삭제',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: '삭제 완료' } },
      },
    },

    '/ip/ips': {
      get: {
        tags: ['IP 관리'],
        summary: 'IP 목록 조회',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['used', 'reserved', 'off', 'free'] }, description: '상태 필터' },
          { name: 'team',   in: 'query', schema: { type: 'string' }, description: '팀 ID 필터 (예: t2)' },
        ],
        responses: { 200: { description: 'IP 목록', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/IpAddress' } } } } } },
      },
      post: {
        tags: ['IP 관리'],
        summary: 'IP 추가',
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/IpAddressBody' } } } },
        responses: { 201: { description: '생성된 IP', content: { 'application/json': { schema: { $ref: '#/components/schemas/IpAddress' } } } } },
      },
    },

    '/ip/ips/{id}': {
      put: {
        tags: ['IP 관리'],
        summary: 'IP 전체 수정',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/IpAddressBody' } } } },
        responses: { 200: { description: '수정된 IP', content: { 'application/json': { schema: { $ref: '#/components/schemas/IpAddress' } } } } },
      },
      patch: {
        tags: ['IP 관리'],
        summary: 'IP 부분 수정 (status 등)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: { 'application/json': { schema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['used', 'reserved', 'off', 'free'] },
              name:   { type: 'string' },
              mac:    { type: 'string' },
              memo:   { type: 'string' },
              team:   { type: 'string' },
            },
          } } },
        },
        responses: { 200: { description: '수정된 IP', content: { 'application/json': { schema: { $ref: '#/components/schemas/IpAddress' } } } } },
      },
      delete: {
        tags: ['IP 관리'],
        summary: 'IP 삭제',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: '삭제 완료' } },
      },
    },

    // ── 관리 ───────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['관리'],
        summary: 'DB 연결 상태 확인',
        responses: {
          200: { description: '정상', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, time: { type: 'string' } } } } } },
          500: { description: 'DB 오류' },
        },
      },
    },

    '/sync': {
      post: {
        tags: ['관리'],
        summary: '즉시 동기화 (휴가·회의실·출퇴근)',
        responses: {
          200: { description: '동기화 시작됨', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, message: { type: 'string' } } } } } },
        },
      },
    },

    '/hr-batch': {
      post: {
        tags: ['관리'],
        summary: '인사정보 배치 즉시 실행',
        responses: {
          200: { description: '배치 시작됨', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, message: { type: 'string' } } } } } },
        },
      },
    },

    '/sync-holidays': {
      post: {
        tags: ['관리'],
        summary: '공휴일 수집 (연도 지정)',
        parameters: [
          { name: 'year', in: 'query', schema: { type: 'integer', example: 2026 }, description: '수집할 연도 (기본: 올해)' },
        ],
        responses: {
          200: {
            description: '수집 시작됨',
            content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, message: { type: 'string', example: '2026년 공휴일 수집 시작' } } } } },
          },
        },
      },
    },

    '/backfill-commute': {
      post: {
        tags: ['관리'],
        summary: '이번 달 출퇴근 전체 재동기화',
        description: '이번 달 1일부터 오늘까지 출퇴근 데이터를 전부 재수집합니다. 스키마 변경 후 기존 레코드 백필 시 사용합니다.',
        responses: {
          200: {
            description: '백필 시작됨',
            content: { 'application/json': { schema: {
              type: 'object',
              properties: {
                ok:      { type: 'boolean' },
                message: { type: 'string', example: '출퇴근 백필 시작 (2026-04-01~2026-04-27)' },
              },
            } } },
          },
        },
      },
    },
  },

  components: {
    schemas: {
      DashboardToday: {
        type: 'object',
        properties: {
          us_id:             { type: 'string' },
          name:              { type: 'string', example: '오찬열' },
          dept_id:           { type: 'string', example: 'A00000022' },
          dept_name:         { type: 'string', example: '구독6팀' },
          status:            { type: 'string', enum: ['출근', '미출근', '미등록', '종일휴가', '반차', '반차출근', '공휴일'], example: '출근' },
          actual_start_time: { type: 'string', nullable: true, example: '09:05:00' },
          actual_end_time:   { type: 'string', nullable: true },
          work_minutes:      { type: 'integer', nullable: true },
          is_late:           { type: 'boolean', nullable: true },
          time_unit:         { type: 'string', nullable: true },
          time_unit_name:    { type: 'string', nullable: true },
          vac_stime:         { type: 'string', nullable: true },
          vac_etime:         { type: 'string', nullable: true },
          holiday_name:      { type: 'string', nullable: true },
        },
      },
      DashboardStats: {
        type: 'object',
        properties: {
          name:               { type: 'string', example: '오찬열' },
          dept_id:            { type: 'string' },
          dept_name:          { type: 'string' },
          total_days:         { type: 'integer', description: '조회 기간 내 근무일수' },
          attended_days:      { type: 'integer', description: '출근 등록일수' },
          absent_days:        { type: 'integer', description: '미출근일수 (휴가 제외)' },
          late_count:         { type: 'integer', description: '지각 횟수' },
          vacation_days:      { type: 'integer', description: '종일휴가 일수' },
          avg_start_min:      { type: 'integer', nullable: true, description: '평균 출근 시각 (자정 기준 분, 예: 549 = 09:09)' },
          total_work_minutes: { type: 'integer', description: '총 근무 분' },
        },
      },
      IpTeam: {
        type: 'object',
        properties: {
          id:     { type: 'string', example: 't2' },
          name:   { type: 'string', example: '2팀' },
          prefix: { type: 'string', example: '192.168.12' },
          start:  { type: 'integer', example: 51 },
          end:    { type: 'integer', example: 100 },
          color:  { type: 'string', example: '#58a6ff' },
        },
      },
      IpTeamBody: {
        type: 'object',
        required: ['name', 'start', 'end'],
        properties: {
          id:     { type: 'string', description: '생략 시 자동 생성' },
          name:   { type: 'string', example: '2팀' },
          prefix: { type: 'string', example: '192.168.12' },
          start:  { type: 'integer', example: 51 },
          end:    { type: 'integer', example: 100 },
          color:  { type: 'string', example: '#58a6ff' },
        },
      },
      IpAddress: {
        type: 'object',
        properties: {
          id:     { type: 'string', example: '4960' },
          ip:     { type: 'string', example: '192.168.12.58' },
          status: { type: 'string', enum: ['used', 'reserved', 'off', 'free'], example: 'used' },
          name:   { type: 'string', example: '무신사' },
          device: { type: 'string', example: 'HyperV' },
          mac:    { type: 'string', example: '00-15-5D-00-C0-26' },
          memo:   { type: 'string', example: 'musinsa / host:local-musinsa' },
          date:   { type: 'string', example: '2026-04-23' },
          team:   { type: 'string', example: 't2' },
        },
      },
      IpAddressBody: {
        type: 'object',
        required: ['ip'],
        properties: {
          id:     { type: 'string', description: '생략 시 자동 생성' },
          ip:     { type: 'string', example: '192.168.12.58' },
          status: { type: 'string', enum: ['used', 'reserved', 'off', 'free'], default: 'free' },
          name:   { type: 'string' },
          device: { type: 'string' },
          mac:    { type: 'string' },
          memo:   { type: 'string' },
          date:   { type: 'string', example: '2026-04-23' },
          team:   { type: 'string', example: 't2' },
        },
      },
      Holiday: {
        type: 'object',
        properties: {
          holiday_id:   { type: 'string' },
          holiday_date: { type: 'string', example: '2026-01-01' },
          holiday_name: { type: 'string', example: '1월1일' },
          public_yn:    { type: 'string', example: 'Y' },
          deduct_yn:    { type: 'string', example: 'N' },
        },
      },
      Department: {
        type: 'object',
        properties: {
          dept_id:   { type: 'string', example: '000601' },
          dept_name: { type: 'string', example: '경영기획팀' },
          level:     { type: 'integer', example: 3 },
          parent:    { type: 'string', nullable: true, example: '0006' },
          path:      { type: 'string', example: '00-0006-000601', description: 'recursive CTE로 동적 계산' },
        },
      },
      DepartmentNode: {
        type: 'object',
        properties: {
          dept_id:   { type: 'string', example: '0009' },
          dept_name: { type: 'string', example: '구독그룹' },
          level:     { type: 'integer', example: 2 },
          parent:    { type: 'string', nullable: true, example: '00' },
          path:      { type: 'string', example: '00-0009' },
          children:  { type: 'array', items: { $ref: '#/components/schemas/DepartmentNode' } },
        },
      },
      User: {
        type: 'object',
        properties: {
          us_id:        { type: 'string', example: 'chanyeol5' },
          us_name:      { type: 'string', example: '오찬열' },
          dept_id:      { type: 'string', example: 'A00000022' },
          dept_name:    { type: 'string', example: '구독6팀' },
          us_roll_name: { type: 'string', nullable: true, example: null },
          us_pos_name:  { type: 'string', nullable: true, example: '매니저' },
          us_mail1:     { type: 'string', example: 'chanyeol5@unipost.co.kr' },
          slack_id:     { type: 'string', nullable: true },
          is_leader:    { type: 'boolean' },
          enter_date:   { type: 'string', nullable: true, example: '2025-09-02' },
          retire_date:  { type: 'string', nullable: true },
          emp_no:       { type: 'string', nullable: true, example: 'U2509003' },
          user_show_yn: { type: 'string', example: 'Y' },
        },
      },
      History: {
        type: 'object',
        properties: {
          id:          { type: 'integer' },
          us_id:       { type: 'string' },
          us_name:     { type: 'string' },
          change_type: { type: 'string', enum: ['JOIN', 'LEAVE', 'DEPT_CHANGE', 'ROLE_CHANGE'] },
          field_name:  { type: 'string', nullable: true },
          old_value:   { type: 'string', nullable: true },
          new_value:   { type: 'string', nullable: true },
          detected_at: { type: 'string', example: '2026-04-01T01:00:00.000Z' },
        },
      },
      CommuteToday: {
        type: 'object',
        properties: {
          dept_id:              { type: 'string', example: 'A00000022' },
          name:                 { type: 'string', example: '오찬열' },
          work_date:            { type: 'string', example: '2026-04-24' },
          scheduled_start_time: { type: 'string', example: '09:00:00' },
          actual_start_time:    { type: 'string', nullable: true, example: '08:38:50' },
          actual_end_time:      { type: 'string', nullable: true },
          is_late:              { type: 'boolean' },
          is_absent:            { type: 'boolean' },
          start_device_name:    { type: 'string', nullable: true, example: 'APP' },
          time_unit:            { type: 'string', nullable: true, example: 'FULL', description: 'FULL(종일연차) / HOUR(반차·시간)' },
          time_unit_name:       { type: 'string', nullable: true, example: '종일' },
          vac_stime:            { type: 'string', nullable: true, example: '0900', description: '휴가 시작 시각 (HHMM)' },
          vac_etime:            { type: 'string', nullable: true, example: '1100', description: '휴가 종료 시각 (HHMM) — 반차 시 출근 예정 기준' },
        },
      },
      CommuteRecord: {
        type: 'object',
        properties: {
          dept_id:              { type: 'string' },
          name:                 { type: 'string' },
          work_date:            { type: 'string' },
          scheduled_start_time: { type: 'string', nullable: true },
          scheduled_end_time:   { type: 'string', nullable: true },
          actual_start_time:    { type: 'string', nullable: true },
          actual_end_time:      { type: 'string', nullable: true },
          work_minutes:         { type: 'integer', nullable: true },
          break_minutes:        { type: 'integer', nullable: true },
          is_late:              { type: 'boolean' },
          is_early_leave:       { type: 'boolean' },
          is_absent:            { type: 'boolean' },
          start_place_name:     { type: 'string', nullable: true },
          start_device_name:    { type: 'string', nullable: true },
          end_device_name:      { type: 'string', nullable: true },
          time_unit:            { type: 'string', nullable: true, example: 'FULL', description: 'FULL(종일연차) / HOUR(반차·시간)' },
          time_unit_name:       { type: 'string', nullable: true, example: '종일' },
          vac_sdate:            { type: 'string', nullable: true, example: '2026-04-24' },
          vac_edate:            { type: 'string', nullable: true, example: '2026-04-24' },
          vac_stime:            { type: 'string', nullable: true, example: '0900' },
          vac_etime:            { type: 'string', nullable: true, example: '1100' },
        },
      },
      Vacation: {
        type: 'object',
        properties: {
          us_name:            { type: 'string', example: '오찬열' },
          dept_name:          { type: 'string', example: '구독6팀' },
          time_unit_name:     { type: 'string', example: '종일' },
          use_time_type_name: { type: 'string', nullable: true },
          use_sdate:          { type: 'string', example: '2026-04-24' },
          use_edate:          { type: 'string', nullable: true },
          use_stime:          { type: 'string', nullable: true },
          use_etime:          { type: 'string', nullable: true },
        },
      },
      RoomBooking: {
        type: 'object',
        properties: {
          room_name:  { type: 'string', example: '중회의실(에땅)' },
          title:      { type: 'string', example: '주간 스프린트' },
          booker:     { type: 'string', example: '오찬열' },
          book_date:  { type: 'string', example: '2026-04-24' },
          start_time: { type: 'string', example: '2026-04-24T10:00:00.000Z' },
          end_time:   { type: 'string', example: '2026-04-24T11:00:00.000Z' },
        },
      },
    },
  },
};

module.exports = spec;
