# Quartz 빌드 후 nginx로 정적 파일 서빙
FROM node:22-alpine AS builder

WORKDIR /app

# Quartz 클론 및 설치
RUN apk add --no-cache git && \
    git clone https://github.com/jackyzha0/quartz.git . && \
    npm install

# Obsidian 노트 복사 (content 폴더에)
COPY content/ ./content/

# 빌드
RUN npx quartz build

# nginx로 서빙
FROM nginx:alpine
COPY --from=builder /app/public /usr/share/nginx/html
EXPOSE 80
