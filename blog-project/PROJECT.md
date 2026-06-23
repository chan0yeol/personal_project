# Blog Auto Project

키워드 + URL → 개요 확인 → AI 본문 생성 → 이미지 선택 → WordPress 자동 발행  
구글 애드센스 승인 + SEO 최적화에 특화된 영양제 블로그 반자동화 시스템

---

## 시스템 아키텍처

```
사용자 (브라우저 :3000)
    │
    ▼
Next.js Frontend (:3000)
    │  /api/* rewrites
    ▼
FastAPI Backend (:8000)
    ├── /api/suggest-main-keyword  → Groq (건강·영양 메인 키워드 1개 자동 추천)
    ├── /api/suggest-keywords      → Gemini/Groq (서브키워드 5개 추천)
    ├── /api/fetch                 → httpx + BeautifulSoup (URL 본문 추출)
    ├── /api/outline               → Gemini/Groq (개요 생성)
    ├── /api/generate              → Gemini/Groq (개요 기반 본문 생성)
    ├── /api/images                → Pixabay API (이미지 검색)
    └── /api/publish               → WordPress REST API (마크다운→HTML 변환 후 발행)
```

```
Docker Network (blog-net)
├── blog-backend   (Python FastAPI :8000)
└── blog-frontend  (Next.js :3000)

외부 서비스
├── Gemini API         (AI 생성 — 무료, 우선)
├── Solar API          (AI 생성 — Upstage, 한국어 특화, 2순위)
├── Groq API           (AI 생성 — 폴백)
├── Pixabay API        (이미지)
└── WordPress          (http://100.109.108.36:8081)
```

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Backend | Python 3.11, FastAPI |
| AI (1순위) | Gemini API (gemini-2.5-flash 권장, 무료) |
| AI (2순위) | Solar API (Upstage, 한국어 특화) |
| AI (3순위) | Groq API (llama-3.3-70b-versatile, 폴백) |
| 이미지 | Pixabay API |
| 발행 | WordPress REST API + Application Password |
| 인프라 | Docker, Docker Compose |

---

## 프로젝트 구조

```
blog-project/
├── docker-compose.yml
├── .env
├── .env.example
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                  # FastAPI 앱 진입점, CORS 설정
│   └── routers/
│       ├── __init__.py
│       ├── fetch.py             # URL 본문 추출 (httpx + BeautifulSoup)
│       ├── generate.py          # 개요 생성 + 본문 생성 + 키워드 추천
│       ├── images.py            # Pixabay 이미지 검색
│       ├── publish.py           # WordPress 발행 (마크다운→HTML, 이미지 업로드, RankMath 메타)
│       └── refine.py            # Claude 다듬기 (선택, 수동 실행용)
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.mjs          # /api/* → backend:8000 rewrite
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   └── page.tsx         # 5단계 스텝 워크플로우 메인 페이지
        └── components/
            ├── StepInput.tsx    # Step 1: 키워드 입력 + 메인/서브키워드 자동추천
            ├── StepOutline.tsx  # Step 2: 개요 확인/편집 → 본문 생성 요청
            ├── StepDraft.tsx    # Step 3: 본문 편집 (마크다운 편집 + HTML 미리보기)
            ├── StepImages.tsx   # Step 4: 대표 이미지 + 본문 이미지 다중 선택
            └── StepPublish.tsx  # Step 5: WordPress 발행
```

---

## 사용자 워크플로우 (5단계)

```
Step 1. 키워드 & URL 입력
┌─────────────────────────────────────┐
│ 메인 키워드: [마그네슘 영양제     ] │
│  [🎲 메인 키워드 추천] [서브키워드 추천] │
│ ※ 메인 키워드 추천: Groq가 건강·영양 │
│   분야 롱테일 키워드 1개 자동 생성  │
│ 서브키워드 1~5: [자동추천 또는 직접입력] │
│ 참고 URL: https://...              │
│ 톤: [정보형] [친근한] [전문적]      │
│               [개요 생성 →]        │
└─────────────────────────────────────┘

Step 2. 개요 확인 & 편집
┌─────────────────────────────────────┐
│ 제목 후보 3개 중 선택 또는 직접 입력 │
│ 섹션 구성 (편집 가능)               │
│ 태그 / 메타설명                     │
│               [본문 생성 →]        │
└─────────────────────────────────────┘

Step 3. 본문 편집
┌─────────────────────────────────────┐
│ 제목 / 태그 / 메타설명 편집         │
│ [편집 탭] [미리보기 탭]             │
└─────────────────────────────────────┘

Step 4. 이미지 선택
┌─────────────────────────────────────┐
│ [📌 대표 이미지 선택] [🖼️ 본문 이미지 선택 (0/5)] │
│ 검색어 변경 가능 (섹션별 다른 키워드) │
│ 선택된 이미지에 대표 / 본문1~5 라벨 │
│ 선택 요약: 대표 1장 + 본문 N장      │
└─────────────────────────────────────┘

Step 5. 발행
┌─────────────────────────────────────┐
│ [임시저장] [즉시 발행]              │
│ → 대표 이미지: WP 미디어 업로드 → featured_media │
│ → 본문 이미지: WP 미디어 업로드 → H2 사이 자동 삽입 │
│ → RankMath 메타 자동 설정           │
│ → WordPress 포스트 링크 반환        │
└─────────────────────────────────────┘
```

---

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/suggest-main-keyword` | 건강·영양 메인 키워드 1개 자동 생성 (Groq 전용) |
| `POST` | `/api/suggest-keywords` | 메인 키워드 기반 서브키워드 5개 추천 |
| `POST` | `/api/fetch` | URL 리스트에서 본문 텍스트 추출 |
| `POST` | `/api/outline` | 개요 생성 (제목 후보 3개 + 섹션 구성 + 태그 + 메타설명) |
| `POST` | `/api/generate` | 확정된 개요 기반 마크다운 본문 생성 |
| `GET`  | `/api/images` | Pixabay 이미지 검색 |
| `POST` | `/api/publish` | WordPress 발행 (마크다운→HTML, 이미지 WP 업로드, RankMath 메타) |
| `GET`  | `/api/wp-test` | WordPress 연결 및 권한 진단 |
| `POST` | `/api/refine` | Claude로 본문 다듬기 (수동 실행, 선택) |
| `GET`  | `/health` | 헬스체크 |

---

## AI 생성 전략

### 모델 우선순위 (Gemini → Solar → Groq 폴백)
1. **Gemini** (1순위): `GEMINI_MODEL` 환경변수 기준, 기본값 `gemini-2.5-flash`
2. **Solar** (2순위): Upstage `solar-pro` — 한국어 특화, 외국어 감지 생략
3. **Groq** (3순위): `llama-3.3-70b-versatile` — 분당 12,000 토큰 / 일 1,000 요청
4. 외국어 감지 시 다음 모델로 폴백
- `/api/suggest-main-keyword`는 Groq 전용 (다양성 확보, temperature 1.0)

### 2단계 생성 파이프라인

```
Step 1. 개요 생성 (/api/outline)
  입력: 키워드 + 서브키워드 + 참고자료 + 톤
  출력: 제목 후보 3개 / 섹션 5~6개 / 태그 / 메타설명
  → 사용자가 확인·수정 후 승인

Step 2. 본문 생성 (/api/generate)
  입력: 확정 제목 + 섹션 구조 + 태그 + 메타설명
  출력: 마크다운 본문 2000단어(7000자) 이상
  → RankMath 그린 기준 적용 프롬프트
```

### 본문 SEO 프롬프트 규칙 (RankMath 그린 목표)

```
1. 도입부 첫 문장에 Focus Keyword 포함
2. H2 소제목 최소 2개에 키워드 포함
3. 키워드 밀도 1~1.5% (8~12회)
4. 외부 링크 2개 (국내 공신력 있는 기관: 식약처, 보건복지부 등)
5. 내부 링크 2개 (WP_URL 기반 실제 도메인 검색 URL)
6. 메타 설명: 키워드로 시작, 140~155자, CTA 포함
7. 표(table) 1개 이상 (권장량/연령별 등)
8. FAQ 섹션 1개 (질문 3개 + 답변)
9. 한 문장 20단어 이내, 한 문단 3~4문장 이내
10. 최소 2000단어 (7000자) — 미달 시 생성 실패로 간주
```

### 글 구조
```
도입부 (공감 시나리오 → 키워드 → 이 글에서 얻을 3가지)
효능/특징 섹션 (굵은 부제목, 작용 원리 + 실생활 예시)
복용법 섹션 (연령대별 표, 복용 시간, 흡수율 조합)
부작용 섹션 (과다복용 증상, 약물 상호작용, 주의 대상)
FAQ 섹션 (자주 검색하는 질문 3개)
마치며 (핵심 3줄 요약 + 전문가 상담 권장 문구)
```

---

## 이미지 처리

### 대표 이미지
- Pixabay에서 선택 → WP 미디어 라이브러리 업로드 → `featured_media` 설정
- alt 텍스트: Focus Keyword 자동 적용
- 파일명: `{alt-slug}-{timestamp}.{ext}` (SEO 가산점)

### 본문 이미지
- Pixabay에서 최대 5장 별도 선택 (검색어 변경 가능)
- 모두 WP 미디어 라이브러리 업로드 → 자체 호스팅 URL 사용
- 마크다운의 H2 섹션 사이에 균등 분배 자동 삽입
- `<figure>` + `<figcaption>` 형태 (캡션 = alt 텍스트)
- 업로드 실패 시 원본 Pixabay URL fallback

---

## RankMath 메타 자동 설정

발행 시 WordPress REST API `meta` 필드로 자동 주입:

```json
{
  "meta": {
    "rank_math_focus_keyword": "마그네슘 영양제",
    "rank_math_title": "포스트 제목",
    "rank_math_description": "메타 설명 140~155자"
  },
  "excerpt": "메타 설명"
}
```

> **주의**: WordPress 관리자 → RankMath → 일반 설정 → 고급 → REST API 활성화 필요

---

## 발행 전략

- **기본값: 임시저장(draft)** — 검수 후 WordPress에서 예약발행 권장
- 추천 발행 시간: 오전 7~9시 또는 오후 12~1시 (트래픽 피크)
- 하루 1~2개 권장 (몰아쓰기 시 스팸 의심)
- 10~15개 포스팅 후 애드센스 신청

---

## WordPress 설정

### HTTP 사이트 Application Password 활성화
```bash
docker exec wordpress-wordpress-1 bash -c \
  'echo "add_filter('"'"'wp_is_application_passwords_available'"'"', '"'"'__return_true'"'"');" >> /var/www/html/wp-config.php'
```

### Application Password 발급
WordPress 관리자 → 사용자 → 프로필 → 애플리케이션 비밀번호

---

## 환경변수 (.env)

```env
# Solar AI (https://console.upstage.ai - 한국어 특화, 1순위)
UPSTAGE_API_KEY=your_upstage_api_key

# Gemini AI (https://aistudio.google.com - 무료, 2순위)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Groq AI (https://console.groq.com - 폴백 + 메인키워드 추천 전용)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Claude (https://console.anthropic.com - 다듬기 전용, 선택)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Pixabay (https://pixabay.com/api/docs)
PIXABAY_API_KEY=your_pixabay_api_key

# WordPress
WP_URL=http://100.109.108.36:8081
WP_USER=your_wp_username
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx
```

---

## 실행

```bash
cd D:/999.오찬열/00.project/blog-project

# 최초 실행
cp .env.example .env
# .env 편집 후

docker compose up -d --build

# 코드 변경 후 재시작
docker compose up -d --build backend
docker compose up -d --build frontend

# 로그 확인
docker compose logs -f backend
docker compose logs -f frontend
```

접속: `http://localhost:3000`

---

## 블로그 운영 전략 (애드센스 승인 목표)

### 주제: 영양제 정보
- YMYL 위험 회피: 의학적 치료 표현 금지, 건강기능식품 정보 위주
- 전문가 상담 권장 문구로 책임 분산

### 추천 키워드 목록
```
# 성분별
마그네슘 영양제 효능 종류
비타민D 하루 권장량 복용법
오메가3 EPA DHA 차이
루테인 눈 영양제 고르는법
유산균 프로바이오틱스 추천

# 대상별
50대 영양제 추천 조합
임산부 영양제 먹는 순서
남성 영양제 추천 루틴

# 비교/추천
종합비타민 브랜드 비교 2026
단백질 보충제 종류 차이
```

---

*Last Updated: 2026-04-15*
