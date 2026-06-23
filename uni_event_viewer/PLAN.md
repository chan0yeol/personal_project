# UNI Event Viewer - Chrome Extension 기획서

## 개요
사내 JS 솔루션($u 프레임워크) 기반 웹 애플리케이션에서 등록된 이벤트 핸들러를
Chrome DevTools 패널에서 실시간으로 확인하고 소스 위치로 이동할 수 있는 개발자 도구 확장프로그램.
AI 코드 어시스턴트(Groq/Upstage + RAG), 인수인계 문서 자동 생성, Performance 마커 연동 기능 포함.

## 배경 및 목적
- `$u.addHandler()`, `$u.buttons.addCustomHandler()`, `$u.get(field).$el.change()` 등
  다양한 방식으로 이벤트가 등록되어 있어 파악이 어려움
- 고객사 환경별로 customize.js가 다르게 적용되어 어떤 이벤트가 걸려있는지 확인 불편
- 확장프로그램을 켜두기만 하면 자동으로 후킹하여 한눈에 확인 가능하도록 함

---

## 수집 대상 이벤트

| 메서드 | 분류 | 수집 방식 |
|--------|------|----------|
| `$u.addHandler(id, fn)` | HDL | 동적 등록 시 후킹 자동 수집 |
| `$u.buttons.addCustomHandler(id, fn)` | BTN | 동적 등록 시 후킹 자동 수집 |
| `$u.buttons.getHandler()` | HDL | Scan 버튼으로 스냅샷 수집 |
| `$u.buttons.getCustomHandlers()` | BTN | Scan 버튼으로 스냅샷 수집 |
| `$u.get(field).$el.change/click/...` | FLD | 후킹 자동 수집 + 실행 추적 |
| `$u.gridWrapper.getGrid().onCellClick/...` | GRD | gridObj 후킹 자동 수집 + 실행 추적 |

> BTN/HDL은 customize.js 초기화 시 등록되어 후킹 타이밍보다 빠름 → Scan으로 보완

---

## 아키텍처

```
[페이지 컨텍스트]
  injected.js (world: MAIN, content_scripts로 주입)
    - $u.addHandler / addCustomHandler 래핑 (동적 등록 감지)
    - $u.get() 래핑 → $el Proxy로 jQuery 이벤트 등록 + 실행 감지
    - $u.gridWrapper.getGrid() 래핑 → gridObj 이벤트 후킹
    - window.__UNI_FN_MAP__에 FLD/GRD 함수 참조 저장 (소스 이동용)
    - 실행 시 performance.mark/measure 자동 삽입 (FLD/GRD)
    - 감지 시 window.postMessage 발송

[Content Script] (isolated world)
  content-script.js
    - window.postMessage 수신 → chrome.runtime.sendMessage 릴레이
    - 화면 컨텍스트 수집 요청 처리 ($u.getValues, 그리드 컬럼)

[Background Service Worker]
  background.js
    - tabs.onUpdated → injected.js 주입
    - DevTools 패널 포트 연결 관리 (탭별)
    - 탭별 이벤트 저장 및 중계
    - chrome.debugger API로 함수 소스 위치 조회 (GET_FUNCTION_LOCATION)
    - JSDoc 추출 (Debugger.getScriptSource → 역방향 /** */ 블록 파싱)
    - AI API 호출 (Groq / Upstage, RAG 서버 연동)

[DevTools Panel]
  devtools.html/js  - 패널 등록
  panel.html/js     - 등록 탭 / 실시간 탭 / AI 가이드 탭 UI
```

---

## 패널 구성

### 등록 탭
- 페이지에 등록된 핸들러 전체 목록
- Scan 버튼: `$u.buttons.getHandler()` / `getCustomHandlers()` 스냅샷 조회
- 타입 필터 (ALL / HDL / BTN / FLD / GRD), 프로그램 ID 드롭다운, ID/함수명 검색
- 비활성화 토글: 핸들러를 런타임으로 비활성화/재활성화 (페이지 소스 무수정)
- 행 클릭 → 하단 상세 (함수 소스 미리보기 + 복사 + **소스 이동** + AI에게 묻기)
- 문서 생성: 체크된 이벤트를 AI 설명과 함께 인수인계 Markdown으로 다운로드

### 실시간 탭
- 핸들러가 실제 실행될 때마다 라이브 피드 (자동 스크롤)
- 감지 활성화 버튼: BTN/HDL 맵의 함수를 사후 래핑하여 실행 추적 + Performance 마커 활성화
- FLD/GRD는 등록 시점부터 자동 실행 추적 + Performance 마커 자동 삽입
- 실행시간(ms) 표시, 500ms 초과 시 빨간색 강조
- 실행 파라미터 표시 (safeSerializeArgs)
- 항목 클릭 → 소스 이동

### AI 가이드 탭
- 채팅: Groq / Upstage 선택, $u 프레임워크 API 기반 코드 생성 및 이벤트 분석
- RAG 연동: `localhost:3100` RAG 서버에서 유니웍스6 소스 청크 자동 첨부
- 현재 화면 컨텍스트: `$u.getValues()` + 그리드 컬럼 자동 수집 → 실제 ID로 코드 생성
- 패턴 카드: GRD/FLD/BTN/HDL/NST/PAGE 카테고리별 코드 스니펫 브라우징
- AI에게 묻기: 이벤트 소스코드 + JSDoc + 런타임 호출 체인 자동 첨부

### 소스 이동 (chrome.debugger API)
- `Runtime.evaluate`로 함수 객체 획득
- `Runtime.getProperties`로 `[[FunctionLocation]]` 추출
- `chrome.devtools.panels.openResource(url, lineNumber)`로 Sources 탭 이동
- 익명 함수도 소스 이동 가능

| 타입 | 함수 참조 획득 방법 |
|------|-------------------|
| BTN | `$u.buttons.getCustomHandlers()["id"]` |
| HDL | `$u.buttons.getHandler()["id"]` |
| FLD/GRD | `window.__UNI_FN_MAP__["fnKey"]` |

### Performance 마커
- 핸들러 실행마다 `performance.mark()` + `performance.measure()` 자동 삽입
- Chrome DevTools 성능 탭 > 타이밍 섹션에서 `uni:타입:ID` 막대로 시각화

---

## 파일 구조

```
uni_event_viewer/
├── manifest.json          # MV3, permissions: scripting/tabs/debugger/storage
├── PLAN.md
├── PROJECT.md
├── README.md
├── WIKI.md
├── src/
│   ├── injected.js        # 페이지 컨텍스트 후킹 + FN_MAP 저장 + Performance 마커
│   ├── content-script.js  # postMessage → runtime 브릿지 + 화면 컨텍스트 수집
│   ├── background.js      # 메시지 중계 + debugger API + AI API + JSDoc 추출
│   ├── devtools.html      # DevTools 진입점
│   ├── devtools.js        # 패널 등록
│   ├── panel.html         # 패널 UI (등록/실시간/AI 가이드 탭)
│   └── panel.js           # 패널 로직 (렌더링, AI, 패턴 카드, 문서 생성, instrumentBtn)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 구현 완료 현황

- [x] Manifest V3 기반 확장프로그램 구조
- [x] injected.js MAIN world 주입 (CSP 우회)
- [x] $u.addHandler / addCustomHandler 동적 후킹
- [x] $u.get().$el Proxy 기반 FLD 이벤트 등록 + 실행 추적
- [x] $u.gridWrapper.getGrid() 후킹 — GRD 이벤트 등록 + 실행 추적 (direct 12개 + _rg 18개)
- [x] Scan 버튼 (getHandler / getCustomHandlers 스냅샷)
- [x] 프로그램 ID 수집 및 드롭다운 필터
- [x] 등록 탭: 타입 필터, 검색, Clear, 상세 보기, 함수 소스 미리보기
- [x] 비활성화 토글 (FLD/GRD/BTN/HDL 런타임 비활성화/재활성화)
- [x] 실시간 탭: 라이브 피드, 감지 활성화, Clear, 실행시간, 실행 파라미터, 중복 카운트
- [x] chrome.debugger API 기반 소스 이동 (익명함수 포함)
- [x] window.__UNI_FN_MAP__ FLD/GRD 함수 참조 저장
- [x] Performance 마커 자동 삽입 (FLD/GRD/BTN/HDL — performance.mark/measure)
- [x] AI 가이드 탭: Groq / Upstage 채팅, 코드 생성, 이벤트 분석 모드
- [x] RAG 연동 (localhost:3100, 유니웍스6 소스 283파일 / 2,029 청크)
- [x] 현재 화면 컨텍스트 수집 ($u.getValues + 그리드 컬럼)
- [x] 런타임 호출 체인 분석 (ts+duration 윈도우 기반)
- [x] 정적 분석 — 소스에서 호출 함수 추출 + 재귀 callTree 구축
- [x] JSDoc 추출 (CDP Debugger.getScriptSource 역방향 파싱)
- [x] 패턴 카드 (GRD/FLD/BTN/HDL/NST/PAGE 카테고리 스니펫)
- [x] 문서 생성 — AI 설명 포함 인수인계 Markdown 다운로드

---

## 제약사항
- $u 코어는 수정하지 않음 (런타임 래핑)
- BTN/HDL은 customize.js 초기화 시 등록되어 후킹 불가 → Scan + 감지 활성화로 보완
- 소스 이동 시 chrome.debugger 사용으로 노란 경고 바 약 300ms 표시
- RAG 사용 시 프롬프트 토큰 증가 → 소스코드 컨텍스트 유무에 따라 RAG 스킵으로 부분 최적화
- Manifest V3 기준
