# uni-rag

$u 프레임워크 코어 코드베이스를 인덱싱하여 검색 API를 제공하는 RAG 서버.
uni_event_viewer 익스텐션 및 향후 다른 도구에서 API로 연동.

---

## 역할

- $u 코어 소스 파일을 함수 단위로 청킹하여 인덱싱
- 자연어/키워드 질의에 대해 관련 코드 청크 반환
- AI(Groq)에게 넘길 컨텍스트 코드를 제공하는 역할

```
[Chrome Extension]
  질문 입력
    ↓ POST /search
[uni-rag 서버]
  BM25 검색 → 관련 코드 청크 N개 반환
    ↓ top-k chunks
[Extension → Groq API]
  질문 + 코드 컨텍스트 → 답변
```

---

## 인덱싱 대상

여러 프로젝트의 소스 경로를 동시에 인덱싱할 수 있습니다. (쉼표로 구분)

1. **unidocu6-core** (프레임워크 코어)
   - `unidocu-ui/`, `uni_realgrid/wrapper/` 등
2. **unidocu6** (기본 모듈 및 표준 화면)
   - `unidocu-ui/`, `uni-e-fi/`, `uni-e-mm/` 등 (표준 모듈 포함)

예상 파일 수: 100+개 / 예상 청크 수: 1,000+개

---

## 청크 구조

함수 단위로 청킹하며, 어느 프로젝트의 소스인지 `projectName` 필드를 포함합니다.

```json
{
  "id": "D:/.../webjars:unidocu-ui/module/f4data/f4CodeDialog.js:f4CodeDialog._initialize:12",
  "file": "unidocu-ui/module/f4data/f4CodeDialog.js",
  "projectName": "unidocu6-core",
  "sourcePath": "D:/99.project/unidocu6-core/...",
  "fnName": "_initialize",
  "code": "...(함수 소스 전체)...",
  "startLine": 12
}
```

---

## 검색 방식

**MiniSearch 기반 키워드/필드 검색**
- 함수명(`fnName`), 파일명(`file`), 코드(`code`) 필드 가중치 부여
- `unidocu6-core`와 `unidocu6` 등 여러 프로젝트에 걸친 통합 검색 지원

---

## API 스펙

### `POST /search`
```json
// Request
{
  "query": "그리드 셀 변경 시 다른 컬럼 업데이트",
  "topK": 5
}

// Response
{
  "chunks": [
    {
      "id": "...",
      "file": "uni_realgrid/wrapper/unidocuRg.js",
      "projectName": "unidocu6-core",
      "fnName": "onChangeCell",
      "code": "gridObj.onChangeCell = function(fn) { ... }",
      "score": 0.87,
      "startLine": 120,
      "sourcePath": "..."
    }
  ]
}
```

### `GET /health`
```json
{
  "ok": true,
  "indexedChunks": 342,
  "indexedFiles": 67,
  "lastIndexed": "2026-04-24T10:00:00Z"
}
```

### `POST /reindex`
```json
// Response
{ "ok": true, "chunks": 342, "files": 67 }
```

---

## 기술 스택

| 구성 | 기술 |
|------|------|
| 서버 | Node.js + Express |
| 검색 | MiniSearch (키워드/필드 기반) |
| 인덱스 저장 | 메모리 (서버 시작 시 로딩) |
| 코드 파싱 | 정규식 기반 함수 추출 |
| 배포 | Docker Compose |

---

## 디렉토리 구조

```
uni-rag/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── .env.example           # SOURCE_PATH 등 설정
├── src/
│   ├── index.js           # Express 서버 진입점
│   ├── indexer.js         # 파일 파싱 + 청킹
│   ├── searcher.js        # BM25 검색
│   └── chunker.js         # 함수 단위 청크 추출
└── PROJECT.md
```

---

## 환경 변수

```env
# Docker 실행 시 컨테이너 내부 매핑 경로 기준 (쉼표로 구분)
SOURCE_PATH=/projects/unidocu6-core/...,/projects/unidocu6/...
PORT=3100
```

---

## uni_event_viewer 연동

`background.js`에서 RAG 서버 호출 후 Groq 컨텍스트에 포함:

```js
// 1. RAG 검색
const ragRes = await fetch('http://localhost:3100/search', {
  method: 'POST',
  body: JSON.stringify({ query: userQuestion, topK: 5 })
})
const { chunks } = await ragRes.json()

// 2. 코드 컨텍스트 구성
const codeContext = chunks.map(c =>
  `// ${c.file} - ${c.fnName}\n${c.code}`
).join('\n\n')

// 3. Groq 호출 (기존 messages에 컨텍스트 추가)
```

---

## 구현 우선순위

| 순서 | 작업 |
|------|------|
| 1 | 인덱서 - JS 파일 파싱 + 함수 단위 청킹 |
| 2 | BM25 검색 구현 |
| 3 | Express API 서버 |
| 4 | Docker Compose 구성 |
| 5 | uni_event_viewer background.js 연동 |
| 6 | (향후) 벡터 임베딩으로 검색 교체 |
