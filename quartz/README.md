# Quartz - Obsidian 웹 뷰어

Obsidian 노트를 웹사이트로 변환. Cloudflare Access로 인증 처리.

## 구성

```
quartz/
├── Dockerfile
├── docker-compose.yml
├── content/          ← Obsidian 노트 여기에 넣기 (git clone or copy)
└── README.md
```

## 실행 방법

```bash
# 1. Obsidian 노트 content 폴더에 복사
git clone https://github.com/chan0yeol/obsidian.git content

# 2. 빌드 및 실행
docker compose up -d --build
```

접속: `http://서버IP:3010`

## 노트 업데이트 시

Obsidian 노트 변경 후 재빌드 필요:
```bash
cd content && git pull && cd ..
docker compose up -d --build
```

## Cloudflare Access 설정

1. Cloudflare Dashboard → Zero Trust → Access → Applications
2. Add an Application → Self-hosted
3. Domain: `notes.chanyeols.com` (서브도메인)
4. Policy → Include → Emails → `ocy7231@gmail.com` 등록
5. Cloudflare Tunnel로 서버 3010 포트 연결

## 자동 업데이트 (선택)

GitHub Actions로 obsidian 레포 push 시 자동 재빌드 가능.
