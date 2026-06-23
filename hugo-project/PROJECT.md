# Hugo 개발 블로그 자동화

키워드 입력 → AI 본문 생성 → Hugo md 파일 생성 → GitHub 푸시 → OCI 빌드 + deploy.sh

**구현: blog-project에 Hugo 탭 추가** (새 인프라 없음)

---

## blog-project와의 차이점

| 항목 | blog-project (건강) | hugo-project (개발) |
|---|---|---|
| 타겟 독자 | 일반인 | 개발자 |
| 출력 형식 | WordPress REST API | Hugo `.md` 파일 |
| SEO 도구 | RankMath | Hugo front matter (PaperMod) |
| 이미지 | Pixabay 필수 | Pixabay → GitHub static/images/ 업로드 |
| 배포 | WP 발행 버튼 | GitHub 커밋 + OCI SSH |
| 키워드 | 건강/영양제 | 개발 기술 스택 |
| 글 구조 | 영양제 정보 포맷 | 튜토리얼 / 트러블슈팅 포맷 |

---

## 시스템 아키텍처

```
[blog-project 프론트엔드 :3000]
  건강 블로그 탭 (/) | 개발 블로그 탭 (/hugo)
                           │
                           ▼
              [FastAPI /api/hugo/*]
                           │
              ┌────────────┴────────────┐
              │                         │
         GitHub API               Paramiko SSH
         md 파일 커밋              git pull
         static/images/ 업로드    hugo build
         (PyGithub)               bash deploy.sh
                                  └→ rsync public/ /blog/
```

---

## 파일 구조

```
blog-project/
├── docker-compose.yml          # OCI_KEY_LOCAL 볼륨 마운트 추가
├── .env
│
├── backend/
│   ├── requirements.txt        # PyGithub, paramiko, PyYAML 추가
│   ├── main.py                 # hugo 라우터 등록
│   └── routers/
│       ├── generate.py         # AI 우선순위 Solar → Gemini → Groq 로 변경
│       └── hugo.py             # Hugo md 생성 + 배포
│
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx          # NavBar 추가
        │   └── hugo/
        │       └── page.tsx        # Hugo 탭 메인 (5단계 워크플로우)
        └── components/
            ├── NavBar.tsx          # 건강/개발 탭 네비게이션
            └── hugo/
                ├── HugoStepInput.tsx     # Step 1: 주제/카테고리/글유형 입력 + 키워드 추천
                ├── HugoStepOutline.tsx   # Step 2: 제목 선택 + 섹션 확인 + slug/description 편집
                ├── HugoStepDraft.tsx     # Step 3: 본문 편집 / 미리보기 / 프론트매터 편집
                ├── HugoStepImages.tsx    # Step 4: Pixabay 이미지 선택 (대표 + 본문)
                └── HugoStepDeploy.tsx    # Step 5: GitHub 커밋 + OCI 빌드
```

---

## API 엔드포인트

| Method | Path | 설명 |
|---|---|---|
| `POST` | `/api/hugo/suggest-keyword` | 주제 기반 개발 키워드 5개 추천 |
| `POST` | `/api/hugo/outline` | 개요 생성 (튜토리얼/트러블슈팅 구조) |
| `POST` | `/api/hugo/generate` | Hugo front matter + 마크다운 본문 생성 |
| `POST` | `/api/hugo/deploy` | 이미지 업로드 + GitHub 커밋 + OCI SSH 빌드 |
| `GET`  | `/api/hugo/posts` | GitHub 포스트 목록 조회 |

---

## Hugo Front Matter (PaperMod 테마)

```yaml
---
title: "Docker Compose 네트워크 설정 완벽 가이드"
date: 2026-04-23
draft: false
categories: ["Docker", "인프라"]
tags: ["docker-compose", "network", "container"]
description: "Docker Compose에서 네트워크를 설정하는 방법을 예제와 함께 설명합니다."
slug: "docker-compose-network-guide"
showToc: true
TocOpen: false
hidemeta: false
comments: false
disableShare: false
cover:
  image: "/images/docker-compose-network-guide-cover.jpg"
  alt: "Docker Compose 네트워크 설정 완벽 가이드"
  caption: ""
  relative: false
---
```

---

## 배포 흐름 (/api/hugo/deploy)

```
1. Pixabay 이미지 다운로드 (cover_url, body_url)
   → GitHub static/images/{slug}-cover.jpg 업로드
   → GitHub static/images/{slug}-body.jpg 업로드

2. full_md에 이미지 경로 주입
   → front matter에 cover.image: "/images/{slug}-cover.jpg"
   → 첫 번째 H2 다음에 본문 이미지 삽입

3. PyGithub → content/posts/{slug}.md 커밋
   (신규: create_file / 수정: update_file)

4. Paramiko SSH →
   cd {OCI_BLOG_PATH}
   git pull
   hugo
   bash deploy.sh   ← rsync public/ → /blog/ (nginx 서빙 디렉토리)
```

### deploy.sh (OCI 서버 ~/hugo/deploy.sh)
```bash
sudo rsync -avz --delete --exclude static --exclude game \
  --exclude favicon.ico --exclude ads.txt --exclude tools \
  --exclude sitemap.xml public/ /blog/
sudo rsync -avz --delete /home/ubuntu/hugo/tools/ /blog/tools/
sudo rsync -avz --delete /home/ubuntu/hugo/game/ /blog/game/
```

---

## AI 생성 전략

- **모델 우선순위**: Solar (한국어 특화, 무료 $10) → Gemini → Groq 폴백
- **언어**: 한국어 (기술 용어는 영문 유지)
- **코드블록**: 언어 명시 필수 (```bash, ```python 등), 최소 3개
- **길이**: 최소 7000자 (2000단어 이상), 미달 시 실패 처리
- **섹션**: 각 섹션 최소 300단어, H2 소제목 최소 4개

### SEO 프롬프트 규칙
```
1. 제목에 기술명 + 행동 키워드 포함 (가이드, 설정, 트러블슈팅)
2. 도입부 첫 문장에 핵심 키워드 포함, 최소 200자
3. H2 소제목 최소 4개
4. 코드블록 최소 3개 (실제 동작하는 예제)
5. 공식 문서 링크 2개 이상 (실제 URL)
6. slug: 영문 소문자 + 하이픈
7. description: 120~155자
```

---

## 환경변수 (.env)

```env
# Hugo 개발 블로그 배포
GITHUB_TOKEN=ghp_xxxx
GITHUB_REPO=chan0yeol/blog
HUGO_CONTENT_PATH=content/posts
HUGO_BLOG_URL=https://chanyeols.com
OCI_IP=158.180.70.20
OCI_USER=ubuntu
OCI_KEY_LOCAL=D:/999.오찬열/01.key/oci_key   # 호스트 SSH 키 경로 (oci.ppk → OpenSSH 변환)
OCI_BLOG_PATH=/home/ubuntu/hugo
```

### SSH 키 설정
- `oci.ppk` (PuTTY) → PuTTYgen `Conversions → Export OpenSSH key` → `oci_key` 저장
- docker-compose.yml에서 `${OCI_KEY_LOCAL}:/app/keys/oci_key:ro` 로 마운트
- 컨테이너 내부 경로 `/app/keys/oci_key` 고정

---

## 기술 스택

| 항목 | 기술 |
|---|---|
| AI 1순위 | Solar (Upstage, 한국어 특화) |
| AI 2순위 | Gemini |
| AI 3순위 | Groq (폴백) |
| GitHub 연동 | PyGithub |
| OCI SSH | Paramiko |
| Hugo 테마 | PaperMod |
| 이미지 | Pixabay API → GitHub static/images/ |

---

## 트러블슈팅

### 이미지가 Pixabay URL로 저장됨
- 원인: 프론트엔드 미재빌드 (구 `buildFullMd` 코드가 Pixabay URL 직접 주입)
- 해결: `docker compose up -d --build --force-recreate` (백엔드+프론트 동시 재빌드)

### docker compose 재빌드
```bash
docker compose up -d --build --force-recreate
```

---

## 구현 완료

- [x] `backend/routers/hugo.py` 작성
- [x] AI 우선순위 Solar → Gemini → Groq 변경 (generate.py)
- [x] `requirements.txt` PyGithub, paramiko, PyYAML 추가
- [x] `main.py` hugo 라우터 등록
- [x] `.env` Hugo 관련 변수 추가
- [x] `docker-compose.yml` OCI SSH 키 볼륨 마운트
- [x] `frontend/src/app/hugo/page.tsx` 5단계 워크플로우
- [x] Hugo 스텝 컴포넌트 5개 (Input/Outline/Draft/Images/Deploy)
- [x] NavBar 탭 네비게이션 추가
- [x] Pixabay 이미지 → GitHub static/images/ 업로드 후 상대경로 사용
- [x] PaperMod cover.image front matter 자동 주입
- [x] 본문 첫 H2 다음 이미지 자동 삽입
- [x] 프론트매터 편집 (title/slug/date/description) → front_matter 문자열 즉시 반영
- [x] GitHub Personal Access Token 발급
- [x] OCI SSH 키 OpenSSH 형식 변환 (oci.ppk → oci_key)

---

*Last Updated: 2026-04-23*
