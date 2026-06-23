# UNI Event Viewer - 로드맵

## ✅ 기능 1: 프로그램 ID 표시 (완료)

**목적:** 고객사 화면 이동 시 어느 화면의 이벤트인지 구분

**구현 내용**
- `$u.page.getPROGRAM_ID()` 로 programId 수집
- 모든 이벤트(HDL/BTN/FLD/GRD) emit 시 programId 포함
- 등록 탭 테이블에 "프로그램 ID" 컬럼 추가
- 실시간 탭 아이템에 프로그램 ID 뱃지 표시
- 이벤트 수집 시 자동으로 드롭다운에 추가되는 프로그램 ID 필터

---

## ✅ 기능 2: 실행 횟수 카운트 (완료)

**목적:** 같은 핸들러 중복 호출, 무한루프 디버깅

**구현 내용**
- 실시간 탭에서 동일 핸들러(type + id + event) 재실행 시 새 행 추가 대신 `×N` 카운트 배지 증가
- Clear 시 카운트 초기화
- `liveItemMap`으로 DOM 요소 참조 관리

---

## ✅ 기능 3: 실행 시간 측정 (완료)

**목적:** 느린 핸들러 탐지 및 성능 디버깅

**구현 내용**
- `injected.js` trackedFn에서 `performance.now()` 로 fn 실행 전후 측정
- `instrumentBtn` wrap 함수에도 동일하게 적용
- 실시간 탭에 `Xms` 표시
- 500ms 초과 시 빨간색으로 강조

---

## ✅ 기능 추가: 그리드 이벤트 후킹 (완료)

**목적:** RealGrid 기반 그리드 이벤트 핸들러 추적

**구현 내용**
- `$u.gridWrapper.getGrid()` 후킹으로 그리드 반환 시 자동 wrap
- hookU 시점에 `getGridObjMap()` 순회하여 기존 그리드도 처리
- direct 이벤트 12개 (`onCellClick`, `onChangeCell`, `onRowActivate` 등)
- `_rg` 경유 이벤트 18개 (`onCellClicked`, `onCurrentChanged`, `onEditRowChanged` 등)
- 등록/실행 모두 추적, duration 측정 포함, 소스 이동 지원
- `GRD` 타입 뱃지, Grid 필터 버튼 추가

---

## ✅ 기능 4: 비활성화 토글 (완료)

**목적:** 특정 핸들러만 런타임으로 껐다 켜면서 동작 검증

**구현 내용**
- 등록 탭 각 행에 `●` 토글 버튼 추가
- FLD/GRD: `window.__UNI_DISABLED__` Set에 fnKey 추가/제거로 실행 차단
- BTN: `$u.buttons.getCustomHandlers()[id]`를 빈 함수로 교체, `__UNI_ORIG__`에 원본 보존
- HDL: `$u.buttons.getHandler()[id]`를 빈 함수로 교체, `__UNI_ORIG__`에 원본 보존
- 비활성화된 행은 테이블에서 흐리게 표시 (opacity 0.35)

---

## ✅ 기능 5: 실행 파라미터 표시 (완료)

**목적:** 핸들러 호출 시 전달된 인수 확인

**구현 내용**
- `safeSerializeArgs()` — 대형 객체(GridInstance, jQuery, Node 등) 안전 필터링
- 실시간 탭 아이템에 `(arg1, arg2, ...)` 형태로 표시
- 최대 6개 인수, 문자열 100자 제한

---

## ✅ 기능 6: 문서 생성 (완료)

**목적:** 등록된 핸들러 목록 AI 설명 포함 인수인계 자료 생성

**구현 내용**
- 등록 탭 체크박스로 이벤트 선택 (헤더 전체 선택/해제 포함)
- 선택된 이벤트 소스코드 수집 (Scan 소스 or CDP eval .toString())
- JSDoc 추출 (CDP Debugger.getScriptSource → 역방향 /** */ 블록 파싱) → AI 프롬프트 우선 반영
- AI로 이벤트별 1~2문장 설명 순차 생성 (rate limit 방지 200ms 딜레이)
- 진행 오버레이 + 프로그레스 바
- HDL/BTN/FLD/GRD 타입별 그룹핑된 Markdown 다운로드 (`인수인계_프로그램ID_날짜.md`)

---

## ✅ 기능 7: AI 가이드 탭 (완료)

**목적:** 자연어로 원하는 동작을 설명하면 $u 프레임워크 코드를 즉시 생성

**구현 내용**
- Groq (`llama-3.3-70b-versatile`) / Upstage (`solar-pro`) 선택 가능
- API Key `chrome.storage.local` 저장
- 코드 생성 모드: `GROQ_SYSTEM_PROMPT` — $u 전체 API + 코딩 규칙 주입
- 분석 모드: "AI에게 묻기" → 소스코드 + JSDoc + 런타임 호출 체인 첨부 → `ANALYSIS_SYSTEM_PROMPT`
- RAG 연동: `localhost:3100/search` — 유니웍스6 소스 283파일 / 2,029 청크, topK:3
- 현재 화면 컨텍스트: `$u.getValues()` + 그리드 컬럼 수집 → 실제 ID로 코드 생성
- 마크다운 렌더링 (코드블록, 인라인코드, 볼드), 코드 복사 버튼
- 대화 히스토리 최근 8턴 유지
- 패턴 카드: GRD/FLD/BTN/HDL/NST/PAGE 카테고리 스니펫 브라우징 + AI에게 묻기 연동

**현재 과제**
- RAG 사용 시 검색 청크를 프롬프트에 그대로 붙여 토큰 낭비 심함 → 청크 요약 압축 또는 선택적 RAG 적용 검토 필요

---

## ✅ 기능 8: Performance 마커 연동 (완료)

**목적:** $u 핸들러 실행 구간을 Chrome DevTools 성능 탭 타이밍에서 시각화

**구현 내용**
- FLD/GRD: `injected.js` 래퍼에서 핸들러 실행 전후 `performance.mark()` + `performance.measure()` 삽입
- BTN/HDL: `instrumentBtn` 감지 활성화 래퍼에 동일하게 삽입
- 마커명 규칙: `uni:타입:ID` (예: `uni:BTN:BTN_SAVE`, `uni:GRD:GRID1:onCellClick`)
- 성능 탭 > 타이밍 섹션에서 각 핸들러 실행 구간이 막대로 시각화
- `performance.measure()` 실패 시 try/catch로 조용히 스킵

---

## 우선순위

| 순서 | 기능 | 상태 |
|------|------|------|
| 1 | 프로그램 ID 표시 | ✅ 완료 |
| 2 | 실행 횟수 카운트 | ✅ 완료 |
| 3 | 실행 시간 측정 | ✅ 완료 |
| - | 그리드 이벤트 후킹 | ✅ 완료 |
| 4 | 비활성화 토글 | ✅ 완료 |
| 5 | 실행 파라미터 표시 | ✅ 완료 |
| 6 | 문서 생성 (인수인계 MD) | ✅ 완료 |
| 7 | AI 가이드 탭 | ✅ 완료 |
| 8 | Performance 마커 연동 | ✅ 완료 |
