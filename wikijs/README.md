# Wiki.js

Obsidian 노트 웹 뷰어 겸 위키. 인증/권한 관리 내장.

## 구성

| 서비스 | 이미지 | 포트 |
|--------|--------|------|
| Wiki.js | ghcr.io/requarks/wiki:2 | 3000 |
| PostgreSQL | postgres:15-alpine | - |

## 실행 방법

```bash
# .env 파일 생성
cp .env.example .env
# .env에서 DB_PASS 변경 필수

# 실행
docker compose up -d
```

접속: `http://서버IP:3000`

최초 접속 시 관리자 계정 설정 화면이 나옵니다.

## 중지

```bash
docker compose down
```

## Obsidian 노트 가져오기

Wiki.js 관리자 패널 → Storage → Git 연동 설정
- GitHub 레포(`chan0yeol/obsidian`) 연결 후 마크다운 파일 동기화 가능

## 인증 설정

관리자 패널 → Users → 로컬 계정 또는 소셜 로그인(Google 등) 설정
