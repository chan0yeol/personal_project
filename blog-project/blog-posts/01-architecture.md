---
title: "키워드 하나로 블로그 글 자동 발행까지 — AI 블로그 자동화 시스템 설계"
date: 2026-04-14
tags: ["블로그자동화", "AI글쓰기", "FastAPI", "NextJS", "WordPress"]
meta_description: "키워드 입력부터 WordPress 자동 발행까지 5단계로 처리하는 AI 블로그 자동화 시스템의 전체 아키텍처와 설계 의도를 공유합니다."
---

## 왜 만들었나

블로그를 운영하다 보면 글쓰기보다 글감 찾기, 구조 잡기, SEO 최적화가 더 오래 걸린다. 특히 건강·영양 정보 블로그는 키워드 조사부터 본문 작성까지 글 하나에 1~2시간이 기본이다.

이 시간을 줄이고 싶었다. 키워드만 넣으면 서브키워드 추천, 개요 생성, 본문 작성, 이미지 선택, 발행까지 자동으로 처리하는 시스템을 만들기로 했다.

완전 자동화가 아닌 **반자동화**다. AI가 초안을 잡아주면 사람이 검토하고 발행하는 구조로, 품질과 속도를 동시에 잡는 게 목표다.

---

## 전체 시스템 구조

```
사용자 (브라우저 :3000)
    │
    ▼
Next.js Frontend (:3000)
    │  /api/* rewrites
    ▼
FastAPI Backend (:8000)
    ├── /api/suggest-keywords  → AI (서브키워드 추천)
    ├── /api/fetch             → httpx + BeautifulSoup (URL 본문 추출)
    ├── /api/outline           → AI (개요 생성)
    ├── /api/generate          → AI (본문 생성)
    ├── /api/images            → Pixabay API (이미지 검색)
    └── /api/publish           → WordPress REST API (자동 발행)
```

```
Docker Network (blog-net)
├── blog-backend   (Python FastAPI :8000)
└── blog-frontend  (Next.js :3000)

외부 서비스
├── Gemini API    (AI — 무료 티어 우선)
├── Solar API     (AI — Upstage, 한국어 특화 폴백)
├── Groq API      (AI — 최후 폴백)
├── Pixabay API   (이미지)
└── WordPress     (발행 대상)
```

프론트엔드와 백엔드를 분리한 이유는 AI API 키를 브라우저에 노출하지 않기 위해서다. 모든 외부 API 호출은 백엔드에서만 이루어진다.

---

## 5단계 워크플로우

```
Step 1. 키워드 & URL 입력
  메인 키워드 입력 → 서브키워드 5개 자동 추천
  참고 URL 입력 시 본문 추출 후 AI에 컨텍스트로 전달

Step 2. 개요 확인 & 편집
  제목 후보 3개 생성 → 선택 또는 직접 입력
  섹션 구성 확인 및 수정 가능

Step 3. 본문 편집
  마크다운 편집 탭 + HTML 미리보기 탭
  제목, 태그, 메타설명 수정 가능

Step 4. 이미지 선택
  Pixabay에서 관련 이미지 검색
  썸네일로 사용할 이미지 클릭 선택

Step 5. 발행
  WordPress REST API로 즉시 발행 또는 임시저장
  발행된 포스트 URL 반환
```

사용자는 각 단계에서 AI 결과물을 검토하고 수정할 수 있다. 완전 자동이 아니라 반자동인 이유가 여기 있다. AI가 틀린 수치나 어색한 표현을 쓸 수 있기 때문에 사람의 검토가 필수다.

---

## 기술 스택 선택 이유

| 레이어 | 기술 | 선택 이유 |
|--------|------|----------|
| Frontend | Next.js 14 | /api/* 리라이트로 백엔드 프록시 처리 |
| Backend | Python FastAPI | AI SDK들이 Python 지원 가장 풍부 |
| AI (1순위) | Gemini 2.0 Flash | 무료 티어, 한국어 품질 우수 |
| AI (2순위) | Upstage Solar Pro | 한국어 특화, $10 무료 크레딧 |
| AI (3순위) | Groq llama | 완전 무료, 최후 폴백 |
| 이미지 | Pixabay API | 무료 상업용 이미지 |
| 발행 | WordPress REST API | 가장 범용적인 CMS |
| 인프라 | Docker Compose | 환경 일관성 보장 |

AI를 3중 폴백 구조로 설계한 이유는 무료 API의 한계 때문이다. 각 API마다 분당/일일 요청 한도가 있어서 하나가 막히면 다음으로 넘어가는 방식으로 안정성을 확보했다.

---

## 마치며

이 시스템의 핵심은 **무료 AI API 조합**으로 비용 없이 운영하는 것이다. Gemini, Solar, Groq 모두 무료 티어가 있고, 블로그 자동화 수준의 사용량이라면 유료 전환 없이도 충분하다.

다음 편에서는 FastAPI 백엔드에서 AI를 3중 폴백으로 연동하고 한국어 건강 블로그에 최적화된 프롬프트를 설계한 과정을 다룬다.

---

**📸 이미지 캡처 목록**
1. 완성된 자동화 툴 UI 전체 화면 (Step 1 화면)
2. 아키텍처 다이어그램 (위 텍스트 다이어그램을 draw.io나 excalidraw로 시각화)
3. 5단계 워크플로우 흐름도
4. Docker Compose 실행 중인 터미널 화면 (`docker compose ps`)
