# 간밤 미국장 TOP5 — YouTube Shorts 자동화 파이프라인

> 매일 아침 7시, 간밤 미국 증시 이슈를 자동으로 영상 제작 후 YouTube에 업로드

---

## 프로젝트 개요

### 컨셉
아침에 미국장 결과가 궁금한 한국 개인 투자자를 타겟으로, 간밤 미국 증시 주요 이슈 TOP5를 60초 Shorts 영상으로 자동 제작·업로드

### 수익화 목표
- 금융 카테고리 RPM: 일반 뉴스 대비 3~5배 높음
- 채널 1개 월 수익: $50~200 (구독자 규모에 따라)
- 멀티채널 확장 시 곱하기 가능

### 추가 비용: $0
| 항목 | 내용 |
|------|------|
| 뉴스 수집 | CNBC, MarketWatch, Reuters RSS (무료) |
| AI 요약 | Groq API — llama-3.3-70b (무료, 14,400건/일) |
| 지수 데이터 | Yahoo Finance API 직접 호출 (무료) |
| TTS | gTTS — Google Text-to-Speech (무료) |
| 영상 합성 | MoviePy + FFmpeg (무료) |
| 업로드 | YouTube Data API v3 (무료 할당량 내) |

---

## 전체 파이프라인

```
① RSS 수집 (CNBC / MarketWatch / Reuters)
        ↓
② 지수 데이터 조회 (S&P500 / 나스닥 / 다우 / 비트코인)
        ↓
③ Groq AI 스크립트 생성 (한국어 번역 + 요약)
        ↓
④ gTTS 음성 생성 (한국어 TTS)
        ↓
⑤ 영상 합성 (MoviePy + Pillow + FFmpeg)
   [인트로] → [지수현황] → [뉴스1~5] → [아웃트로]
        ↓
⑥ 썸네일 생성 (Pillow)
        ↓
⑦ YouTube 업로드 (YouTube Data API v3)
```

---

## 영상 구조

| 슬라이드 | 내용 | 시간 |
|----------|------|------|
| 인트로 | "간밤 미국장 TOP5" 타이틀 | 3초 |
| 지수 현황 | S&P500 / 나스닥 / 다우 / 비트코인 (전일→현재, 포인트, %) | 5초 |
| 뉴스 1~5 | 헤드라인 + 맥락 포함 3줄 요약 (수치, 이유, 전망) | 각 12초 |
| 아웃트로 | 구독 유도 CTA | 2.5초 |

---

## 프로젝트 구조

```
youtube-project/
├── docker-compose.yml          # 단일 pipeline 서비스
├── .env                        # API 키 등 환경변수 (gitignore)
├── .env.example                # 환경변수 템플릿
├── .gitignore
├── credentials/
│   ├── credentials.json        # YouTube OAuth (gitignore)
│   └── token.json              # YouTube 인증 토큰 (자동 생성)
├── scripts/                    # 테스트용 샘플 스크립트
│   └── news-summary/
│       └── sample.json
├── assets/
│   ├── fonts/                  # 폰트 (컨테이너 내 나눔고딕 사용)
│   └── music/                  # 배경음악 (현재 미사용)
├── volumes/
│   └── output/                 # 생성된 영상 임시 저장
└── services/
    └── pipeline/
        ├── Dockerfile
        ├── requirements.txt
        └── src/
            ├── main.py          # 메인 오케스트레이터 + APScheduler
            ├── news_rss.py      # RSS 뉴스 수집
            ├── market_data.py   # 미국 지수 데이터 (Yahoo Finance 직접 호출)
            ├── script_gen.py    # Groq AI 스크립트 생성
            ├── tts_gen.py       # gTTS 음성 생성
            ├── video_gen.py     # 영상 합성 (슬라이드 전환)
            ├── thumbnail_gen.py # 썸네일 생성
            └── uploader.py      # YouTube Data API v3 업로드
```

---

## 기술 스택

| 역할 | 도구 | 버전 |
|------|------|------|
| 컨테이너 | Docker Compose | - |
| 스케줄러 | APScheduler | 3.10.4 |
| 뉴스 수집 | feedparser | 6.0.11 |
| AI 요약 | Groq (llama-3.3-70b-versatile) | 0.11.0+ |
| 지수 데이터 | requests → Yahoo Finance API | - |
| TTS | gTTS | 2.5.1 |
| 영상 합성 | MoviePy | 1.0.3 |
| 이미지 | Pillow | 10.4.0 |
| 인코딩 | FFmpeg | (컨테이너 내 설치) |
| 폰트 | 나눔고딕 (fonts-nanum) | (컨테이너 내 설치) |
| YouTube 업로드 | google-api-python-client | 2.143.0 |

---

## 환경변수 (.env)

```env
# YouTube API (OAuth 2.0)
YOUTUBE_CREDENTIALS_PATH=/app/credentials/credentials.json
YOUTUBE_TOKEN_PATH=/app/credentials/token.json

# Groq API (무료)
GROQ_API_KEY=your_groq_api_key

# 채널 설정
ACTIVE_CHANNELS=news-summary

# 업로드 시간 (KST)
UPLOAD_HOUR=7
UPLOAD_MINUTE=0

# true: 영상 생성만, 업로드 안 함 (테스트용)
DRY_RUN=false

# true: 시작 즉시 1회 실행
RUN_ON_START=true
```

---

## 설치 및 실행

### 사전 준비
1. Docker Desktop 설치
2. Google Cloud Console에서 YouTube Data API v3 활성화
3. OAuth 2.0 자격증명(credentials.json) 다운로드 → `credentials/` 폴더에 저장
4. Groq API 키 발급 (console.groq.com, 무료)

### 최초 실행

```bash
# 1. 환경변수 설정
cp .env.example .env
# .env 파일에 GROQ_API_KEY 입력

# 2. 빌드
docker compose build

# 3. 실행 (DRY_RUN=true로 테스트 먼저)
docker compose up
```

### 실제 업로드 전환

```bash
# .env에서 DRY_RUN=false 로 변경 후
docker compose down && docker compose up
```

### 코드 수정 시 (재빌드 불필요)

```bash
# src/ 폴더는 볼륨 마운트라 재시작만 하면 됨
docker compose down && docker compose up
```

### requirements.txt 수정 시 (재빌드 필요)

```bash
docker compose build && docker compose up
```

---

## YouTube 인증 설정

1. [Google Cloud Console](https://console.cloud.google.com) → 프로젝트 생성
2. YouTube Data API v3 활성화
3. OAuth 동의화면 설정 (외부, 데스크톱 앱)
4. OAuth 2.0 클라이언트 ID 생성 → JSON 다운로드
5. `credentials/credentials.json` 으로 저장
6. 최초 실행 시 브라우저 인증 → `token.json` 자동 생성

---

## 트러블슈팅

| 문제 | 원인 | 해결 |
|------|------|------|
| `ModuleNotFoundError` | requirements.txt 변경 후 재빌드 안 함 | `docker compose build` |
| yfinance 데이터 실패 | Docker 환경에서 Yahoo Finance 차단 | requests 직접 호출로 교체 (완료) |
| Gemini API 404/429 | AI Studio 키 필요, 지역별 모델 미지원 | Groq으로 교체 (완료) |
| 빌드 캐시 손상 | Docker 내부 스냅샷 오류 | `docker builder prune -f && docker compose build --no-cache` |
| 숫자 오역 | LLM 할루시네이션 | temperature=0.1, 원문 500자 전달, 수치 변경 금지 명시 |

---

## 향후 계획

- [ ] YouTube 최초 인증 자동화 (headless OAuth)
- [ ] 채널 확장 (역사 속 오늘 / 영어 표현 등)
- [ ] 배경음악 추가
- [ ] 텍스트 애니메이션 효과
- [ ] 업로드 결과 알림 (Slack / 카카오톡)
- [ ] GCP Cloud Run으로 이전 (로컬 PC 상시 켜두지 않아도 됨)

---

*최초 작성: 2026-04-22*
