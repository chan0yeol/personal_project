# UNI Event Viewer — Wiki

> 유니웍스($u 프레임워크) 이벤트 핸들러 실시간 디버깅 및 AI 코드 어시스턴트 Chrome DevTools 확장 프로그램

---

## 목차

1. [시스템 구성](#1-시스템-구성)
2. [데이터 흐름](#2-데이터-흐름)
3. [기능 설명](#3-기능-설명)
4. [AI 동작 방식](#4-ai-동작-방식)
5. [설치 및 실행](#5-설치-및-실행)
6. [Performance 마커 연동](#6-performance-마커-연동)

---

## 1. 시스템 구성

### 기술 스택

| 구분 | 내용 |
|------|------|
| 확장 규격 | Chrome Extension Manifest V3 |
| 런타임 | Chrome DevTools Panel |
| AI Provider | Groq (`llama-3.3-70b-versatile`) / Upstage (`solar-pro`) |
| RAG 서버 | `localhost:3100` — 유니웍스6 소스 283파일 / 2,029 청크 인덱싱 |
| CDP | Chrome DevTools Protocol — 함수 위치 조회, 스크립트 소스 추출 |
| 스토리지 | `chrome.storage.local` — API Key, RAG URL, Provider 설정 저장 |

### 파일 구조

```
uni_event_viewer/
├── manifest.json              # MV3 선언 (권한, content_scripts, devtools_page)
├── src/
│   ├── injected.js            # $u 프레임워크 후킹 (MAIN world — 페이지와 같은 컨텍스트)
│   ├── content-script.js      # postMessage ↔ chrome.runtime 브리지 (ISOLATED world)
│   ├── background.js          # Service Worker — CDP, AI API, 이벤트 저장소
│   ├── devtools.html          # DevTools 패널 등록 진입점
│   ├── devtools.js            # chrome.devtools.panels.create 호출
│   ├── panel.html             # DevTools 패널 UI
│   └── panel.js               # 패널 로직 (렌더링, AI 통신, 패턴 카드, 문서 생성)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 컴포넌트 역할

```
┌─────────────────────────────────────────┐
│            유니웍스 페이지               │
│  ┌─────────────────────────────────┐    │
│  │  injected.js  (MAIN world)      │    │  ← $u.addHandler / gridObj 후킹
│  │  window.__UNI_FN_MAP__          │    │  ← 함수 원본 보관
│  │  window.__UNI_DISABLED__        │    │  ← 비활성화 Set
│  └───────────┬─────────────────────┘    │
│              │ window.postMessage        │
│  ┌───────────▼─────────────────────┐    │
│  │  content-script.js (ISOLATED)   │    │  ← 메시지 브리지
│  └───────────┬─────────────────────┘    │
└──────────────┼──────────────────────────┘
               │ chrome.runtime.sendMessage
┌──────────────▼──────────────────────────┐
│         background.js (Service Worker)   │  ← 이벤트 store, CDP, AI API 호출
└──────────────┬──────────────────────────┘
               │ chrome.runtime.connect (Port)
┌──────────────▼──────────────────────────┐
│         panel.js / panel.html            │  ← DevTools 패널 UI
└─────────────────────────────────────────┘
```

---

## 2. 데이터 흐름

### 이벤트 후킹 → 패널 표시

```
페이지 로드
  → injected.js: $u.addHandler / $u.buttons.addCustomHandler / $u.get().$el 후킹
  → 이벤트 등록 시: window.postMessage({ __UNI_EV__: true, event })
  → content-script.js: chrome.runtime.sendMessage({ type: 'UNI_EVENT', event })
  → background.js: store[tabId].push(event)
  → devtoolsPorts[tabId].postMessage({ type: 'NEW_EVENT', event })
  → panel.js: registeredEvents 배열에 추가 → 렌더링
```

### 이벤트 실행 감지 (fired)

```
핸들러 실행
  → injected.js 래퍼 함수: performance.now()로 실행시간 측정
  → window.postMessage({ event: { ...event, fired: true, duration, args } })
  → (위와 동일 경로) → panel.js: firedEvents → 실시간 탭 표시
```

### Performance 마커 자동 기록

```
핸들러 실행 (FLD / GRD / 감지 활성화된 BTN · HDL)
  → performance.mark('uni:타입:ID:start')
  → 원본 함수 실행
  → performance.mark('uni:타입:ID:end')
  → performance.measure('uni:타입:ID', ':start', ':end')
  → Chrome DevTools Performance 탭 > User Timing 섹션에 자동 표시
```

| 타입 | 마커 이름 예시 | 적용 위치 |
|------|--------------|----------|
| FLD | `uni:FLD:FIELD_ID:change` | `injected.js` — $el Proxy 래퍼 |
| GRD | `uni:GRD:GRID_ID:onCellClick` | `injected.js` — gridObj 래퍼 |
| BTN | `uni:BTN:BTN_SAVE` | `panel.js` — 감지 활성화 래퍼 |
| HDL | `uni:HDL:UF_INI` | `panel.js` — 감지 활성화 래퍼 |

> `performance.measure()`로 구간 길이까지 기록되므로 Performance 타임라인에서 각 핸들러의 실행 시간이 막대로 시각화됨

---

### AI 질문

```
panel.js: sendAiMessage()
  → collectPageContext(): content-script → injected → $u.getValues(), 그리드 컬럼 수집
  → buildEventContext(): 이벤트 소스코드 + JSDoc + 런타임 체인 조립
  → chrome.runtime.sendMessage({ type: 'GROQ_CHAT', ... })
  → background.js:
      hasEventContext ? ANALYSIS_SYSTEM_PROMPT : GROQ_SYSTEM_PROMPT
      ragUrl && !hasSourceContext → RAG 서버 /search (topK: 3) → 관련 코드 첨부
      → AI API 호출 → 응답 반환
  → panel.js: 마크다운 렌더링 → 채팅 출력
```

### 소스 이동 (CDP)

```
panel.js: goToSource(ev)
  → chrome.runtime.sendMessage({ type: 'GET_FUNCTION_LOCATION', expr, withJsdoc })
  → background.js:
      chrome.debugger.attach → Debugger.enable → Runtime.evaluate(expr)
      → Runtime.getProperties → [[FunctionLocation]] 추출 (scriptId, lineNumber)
      → withJsdoc: Debugger.getScriptSource → 역방향 /** */ 블록 추출
      → chrome.debugger.detach
  → panel.js: chrome.devtools.panels.openResource(url, lineNumber)
```

---

## 3. 기능 설명

### 등록 탭

| 기능 | 설명 |
|------|------|
| 자동 후킹 | 페이지 로드 시 `injected.js`가 $u 프레임워크를 후킹해 HDL / BTN / FLD / GRD 이벤트 자동 수집 |
| Scan | `$u.buttons.getHandler()` / `getCustomHandlers()` 평가 → 이미 등록된 핸들러 소스코드 수집 |
| 필터 / 검색 | 타입(HDL·BTN·FLD·GRD) 필터, 프로그램 ID 드롭다운, ID·함수명 텍스트 검색 |
| 비활성화 토글 | 이벤트 핸들러를 페이지 컨텍스트에서 런타임으로 비활성화/재활성화 |
| 소스 이동 | CDP로 함수 선언 위치 조회 → DevTools Sources 패널 해당 줄로 이동 |
| AI에게 묻기 | 소스코드 + JSDoc + 런타임 호출 체인을 AI에 전달해 구조화된 분석 반환 |
| 문서 생성 | 체크된 이벤트를 AI로 설명 생성 후 인수인계 Markdown 파일 다운로드 |

### 실시간 탭

| 기능 | 설명 |
|------|------|
| 실행 감지 | 후킹된 이벤트 실행 시 타입·ID·함수명·실행시간(ms)·파라미터 실시간 표시 |
| 중복 집계 | 같은 이벤트 반복 실행 시 카운트(`×N`) 누적 |
| 성능 표시 | 실행시간 500ms 이상이면 빨간색 `slow` 강조 |
| 감지 활성화 | Scan으로 찾은 BTN/HDL 함수를 실행 추적 래퍼로 교체 |
| Performance 마커 | 핸들러 실행마다 `performance.mark()` + `performance.measure()` 자동 호출 → DevTools Performance 탭 User Timing에 실행 구간 시각화 |

### AI 가이드 탭

#### 채팅

| 기능 | 설명 |
|------|------|
| 코드 생성 모드 | 이벤트 컨텍스트 없을 때 → `GROQ_SYSTEM_PROMPT` 사용 (API 목록 + 코딩 규칙) |
| 분석 모드 | "AI에게 묻기"로 이벤트 컨텍스트 첨부 시 → `ANALYSIS_SYSTEM_PROMPT` 사용 |
| RAG 연동 | 질문 시 RAG 서버에서 관련 유니웍스 소스 청크 자동 첨부 (소스코드 있을 때는 스킵) |
| 현재 화면 컨텍스트 | `$u.getValues()` + 그리드 컬럼 정보를 자동 수집해 실제 ID로 코드 생성 |
| Provider 전환 | Groq / Upstage 선택 가능, API Key 별도 저장 |

#### 패턴 카드

$u 프레임워크 코드 스니펫 레퍼런스. 카테고리: `GRD` / `FLD` / `BTN` / `HDL` / `NST` / `PAGE`

- 코드 복사 버튼
- "AI에게 묻기" — 패턴을 컨텍스트로 첨부해 현재 화면에 맞게 활용법 질문

---

## 4. AI 동작 방식

### 프롬프트 분기

```
이벤트 컨텍스트 첨부 (AI에게 묻기)
  → ANALYSIS_SYSTEM_PROMPT
     - 핵심 동작 / 영향 범위 / 주의사항 구조 강제
     - 소스 코드 원문 재출력 금지

컨텍스트 없음 (일반 코드 질문)
  → GROQ_SYSTEM_PROMPT
     - $u API 전체 목록 주입
     - const/let 우선, 함수형 프로그래밍, getJSONData 패턴 등 코딩 규칙
     - 현재 화면 실제 ID 사용, placeholder 금지
     - 목록에 없는 메서드 생성 금지
```

### RAG 흐름

```
질문 → background.js
  → POST localhost:3100/search { query, topK: 3 }
  → 유사 청크 반환 (유니웍스6 소스 기반)
  → 시스템 프롬프트 뒤에 [관련 가이드 및 코드] 로 첨부
  → AI가 사내 API 기반으로 정확하게 답변
```

> 소스코드 컨텍스트가 이미 있을 때(`hasSourceContext`)는 RAG 스킵 → 토큰 절약

### JSDoc 추출 (문서 생성)

```
getJsdocForEvent(ev)
  → GET_FUNCTION_LOCATION (withJsdoc: true)
  → background.js: Debugger.getScriptSource
  → lineNumber 위쪽 역방향 탐색 → /** */ 블록 추출
  → getAiDescription에 [함수 주석] 섹션으로 전달
  → AI가 주석 우선 참고해 설명 생성
```

---

## 5. 설치 및 실행

### 확장 프로그램 로드

1. `chrome://extensions` 접속
2. **개발자 모드** 활성화
3. **압축해제된 확장 프로그램 로드** → `uni_event_viewer/` 폴더 선택

### AI 설정

1. DevTools → **UNI Events** 탭 → **AI 가이드** 탭
2. 🔑 API Key 버튼 클릭
3. Provider 선택 (Groq / Upstage), API Key 입력
4. RAG URL: `http://localhost:3100` 입력 (RAG 서버 실행 중일 때)
5. **저장** 클릭

### RAG 서버 (선택)

RAG 서버는 별도 프로젝트로 관리. `localhost:3100`에서 실행 중이면 자동 연동.  
없어도 AI 기능은 정상 동작 (RAG 컨텍스트 없이 답변).

### 권장 사용 흐름

```
1. 유니웍스 화면 열기
2. DevTools(F12) → UNI Events 탭
3. Scan 클릭 → 기존 핸들러 수집
4. 이벤트 클릭 → AI에게 묻기 (분석)
5. AI 가이드 탭 → 코드 생성 질문
6. 문서 생성 → 인수인계 MD 다운로드
```

### Performance 마커 활용 흐름

```
1. 실시간 탭 → 감지 활성화 (BTN/HDL 래퍼 교체)
2. DevTools Performance 탭 → 녹화 시작 (⏺)
3. 유니웍스 화면에서 버튼 클릭, 필드 변경 등 조작
4. 녹화 중지 → 타임라인 분석
5. 하단 User Timing 섹션에서 uni:BTN / uni:HDL / uni:FLD / uni:GRD 마커 확인
6. 마커 막대 길이 = 핸들러 실행 시간 → 병목 지점 특정
```

---

## 6. Performance 마커 연동

### 개요

`injected.js`와 감지 활성화 래퍼에서 $u 이벤트 핸들러 실행 전후로 **Web Performance API 마커**를 자동 삽입한다.  
별도 설정 없이 기존 DevTools Performance 탭과 연동되어 $u 핸들러 실행 구간을 타임라인에서 시각적으로 확인할 수 있다.

### 마커 삽입 구조

```javascript
// FLD / GRD (injected.js) — 페이지 컨텍스트에서 직접 삽입
const markName = `uni:FLD:${id}:${prop}`
performance.mark(markName + ':start')
const ret = fn.apply(this, arguments)       // 원본 핸들러 실행
performance.mark(markName + ':end')
performance.measure(markName, markName + ':start', markName + ':end')

// BTN / HDL (panel.js instrumentBtn 래퍼) — 감지 활성화 시 삽입
var markName = 'uni:' + type + ':' + fnId;
performance.mark(markName + ':start');
var ret = orig.apply(this, arguments);      // 원본 핸들러 실행
performance.mark(markName + ':end');
performance.measure(markName, markName + ':start', markName + ':end');
```

### Performance 탭 결과 예시

```
User Timing
  ├─ uni:BTN:BTN_SAVE       ████ 42ms
  ├─ uni:HDL:UF_INI         ██ 18ms
  ├─ uni:FLD:FIELD_ID:change █ 5ms
  └─ uni:GRD:GRID1:onCellClick █ 3ms
```

### 주의사항

- FLD / GRD는 페이지 로드 직후부터 마킹 (별도 활성화 불필요)
- BTN / HDL은 **실시간 탭 → 감지 활성화** 클릭 후부터 마킹
- `performance.measure()` 실패 시 `try/catch`로 조용히 스킵 — 기능에 영향 없음
