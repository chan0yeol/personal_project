# SilverBullet - 개인 지식창고

Obsidian 문법 호환 웹 노트. 웹에서 읽기/수정 모두 가능.

## 실행 방법

```bash
# .env 생성
cp .env.example .env
# .env에서 SB_PASS 변경 필수

# 실행
docker compose up -d
```

접속: `http://서버IP:3011`

## Obsidian 노트 가져오기

```bash
# space 폴더에 Obsidian 노트 복사
git clone https://github.com/chan0yeol/obsidian.git space
```

또는 서버에서:
```bash
cp -r /path/to/obsidian/* ./space/
```

## 중지

```bash
docker compose down
```

## Cloudflare Access 연동 (권장)

Cloudflare Zero Trust → Access → Applications → `notes.chanyeols.com` 등록
→ `ocy7231@gmail.com` 이메일 인증으로 접근 제어
