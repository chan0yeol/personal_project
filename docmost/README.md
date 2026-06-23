# Docmost - 개인 지식창고

Notion 느낌의 웹 노트. 트리 사이드바, 웹 편집, 인증 내장.

## 실행 방법

```bash
# .env 생성
cp .env.example .env

# APP_SECRET 생성
openssl rand -hex 32

# .env 수정 후 실행
docker compose up -d
```

접속: `http://서버IP:3012`

최초 접속 시 관리자 계정 등록 화면 나옵니다.

## 중지

```bash
docker compose down
```

## Cloudflare Access 연동 (권장)

Cloudflare Zero Trust → Access → Applications → `notes.chanyeols.com` 등록
→ `ocy7231@gmail.com` 이메일 인증으로 접근 제어
