---
title: "WordPress Docker + nginx 리버스 프록시 + Cloudflare 서브도메인 연결하기"
date: 2026-04-14
tags: ["WordPress", "Docker", "nginx", "Cloudflare", "리버스프록시"]
meta_description: "WordPress를 Docker로 구동하고 nginx 리버스 프록시와 Cloudflare DNS로 커스텀 서브도메인을 연결하는 전체 과정을 설명합니다."
---

## 구성 목표

블로그 자동화 시스템의 발행 대상인 WordPress를 서버에 올리고 커스텀 도메인으로 접근할 수 있게 만드는 것이 목표다.

최종 구성:
```
사용자 → https://blog.chanyeols.com
    → Cloudflare (DNS + SSL)
    → nginx (리버스 프록시)
    → WordPress (Docker, :8081)
```

---

## WordPress Docker 설정

`docker-compose.yml`에 WordPress와 MySQL을 함께 정의한다.

```yaml
services:
  wordpress:
    image: wordpress:latest
    ports:
      - "8081:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_NAME: wordpress
      WORDPRESS_DB_USER: wpuser
      WORDPRESS_DB_PASSWORD: wppassword
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wpuser
      MYSQL_PASSWORD: wppassword
      MYSQL_ROOT_PASSWORD: rootpassword
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

`docker compose up -d`로 실행하면 `localhost:8081`에서 WordPress 설치 화면이 뜬다.

---

## WordPress REST API 활성화

자동화 시스템이 WordPress REST API로 글을 발행하려면 Application Password를 활성화해야 한다. WordPress는 기본적으로 HTTP 환경에서 Application Password를 비활성화한다.

`wp-config.php`에 아래 한 줄을 추가한다.

```bash
docker exec wordpress-wordpress-1 bash -c \
  'echo "add_filter('"'"'wp_is_application_passwords_available'"'"', '"'"'__return_true'"'"');" >> /var/www/html/wp-config.php'
```

그 다음 WordPress 관리자 → 사용자 → 프로필 → 애플리케이션 비밀번호에서 발급한다.

---

## Cloudflare DNS 설정

Cloudflare에서 서브도메인 A 레코드를 추가한다.

| 타입 | 이름 | 콘텐츠 | 프록시 상태 |
|------|------|--------|------------|
| A | blog | 서버 IP | Proxied (주황 구름) |

Proxied 상태로 설정하면 Cloudflare가 SSL을 처리해준다. 방문자와 Cloudflare 사이는 HTTPS, Cloudflare와 원본 서버(nginx) 사이는 설정에 따라 다르다.

---

## nginx 리버스 프록시 설정

`/etc/nginx/sites-available/blog.chanyeols.com` 파일을 생성한다.

```nginx
server {
    listen 80;
    server_name blog.chanyeols.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name blog.chanyeols.com;

    ssl_certificate     /etc/letsencrypt/live/blog.chanyeols.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blog.chanyeols.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 0;
        proxy_read_timeout 3600s;
    }
}
```

심링크로 활성화하고 nginx를 재로드한다.

```bash
sudo ln -s /etc/nginx/sites-available/blog.chanyeols.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

SSL 인증서는 Let's Encrypt로 발급한다.

```bash
sudo certbot certonly --nginx -d blog.chanyeols.com
```

---

## 이미지 깨짐 문제 해결

nginx 리버스 프록시를 연결하고 나서 이미지가 전부 엑박으로 뜨는 문제가 발생했다. 브라우저 콘솔을 보니 리소스 URL이 `https://blog.chanyeols.com/...`이 아닌 `http://100.109.108.36:8081/...` (내부 IP)로 생성되고 있었다.

```
ERR_SSL_PROTOCOL_ERROR
100.109.108.36:8081/wp-includes/js/...
100.109.108.36:8081/wp-content/uploads/...
```

원인은 두 가지였다.

**1. nginx에 프록시 헤더 누락**

`proxy_set_header X-Forwarded-Proto $scheme` 이 없으면 WordPress가 자신이 HTTPS 환경인지 모른다. 이 헤더를 추가해야 WordPress가 올바른 URL을 생성한다.

**2. WordPress 사이트 주소 설정 오류**

WordPress 관리자 → 설정 → 일반에서 두 항목을 수정했다.

- WordPress 주소(URL): `https://blog.chanyeols.com`
- 사이트 주소(URL): `https://blog.chanyeols.com`

이 두 가지를 수정하니 모든 리소스 URL이 올바르게 생성됐다.

---

## 마치며

리버스 프록시 구성에서 가장 흔한 실수는 프록시 헤더를 빠뜨리는 것이다. 특히 `X-Forwarded-Proto`는 WordPress가 HTTPS 여부를 판단하는 데 필수라 반드시 포함해야 한다.

설정을 마치면 `https://blog.chanyeols.com`으로 WordPress에 접근할 수 있고, 자동화 시스템에서 발행한 글이 정상적으로 표시된다.

---

**📸 이미지 캡처 목록**
1. Cloudflare DNS 레코드 설정 화면 (blog A 레코드, Proxied 상태)
2. `https://blog.chanyeols.com` 정상 접속 화면
3. 이미지 깨짐 전 브라우저 콘솔 에러 화면 (ERR_SSL_PROTOCOL_ERROR)
4. WordPress 관리자 → 설정 → 일반 화면 (사이트 주소 수정 부분)
5. 자동화로 발행된 첫 글 화면
