---
title: "홈서버 Docker 컨테이너 모니터링 대시보드 만들기 (React + SSE + Docker Compose)"
date: 2026-03-31T15:02:57+09:00
description: "React와 Server-Sent Events(SSE)로 홈서버 Docker 컨테이너를 실시간 모니터링하는 대시보드를 만들고 Docker Compose로 배포하는 전 과정을 정리합니다."
tags: ["homelab", "docker", "react", "sse", "spring-boot", "docker-compose", "모니터링"]
categories: ["homelab", "개발"]
slug: "homelab-docker-monitoring-dashboard-react-sse"
keywords: ["홈서버 모니터링", "docker 대시보드", "react sse", "컨테이너 모니터링", "homelab dashboard", "docker compose 배포"]
draft: false
---

홈서버를 운영하다 보면 여러 Docker 컨테이너를 손쉽게 확인하고 제어하고 싶다는 생각이 든다.
Portainer 같은 솔루션도 있지만, 직접 만들어보고 싶어서 React 프론트엔드 + Spring Boot 백엔드 구성으로 간단한 모니터링 대시보드를 만들었다.

## 완성 화면

- 컨테이너 목록을 카드 UI로 표시 (상태별 색상 배지)
- 각 카드에서 Start / Stop / Restart 원클릭 제어
- Logs 버튼으로 **실시간 로그 스트리밍** (Server-Sent Events)
- 5초 주기 자동 갱신

## 기술 스택

| 역할 | 기술 |
|---|---|
| 프론트엔드 | React 19, plain CSS |
| 백엔드 | Spring Boot (Docker API 프록시) |
| 실시간 로그 | Server-Sent Events (SSE) |
| 배포 | Docker Compose + nginx |

---

## 백엔드 API 구조

백엔드는 Spring Boot로 Docker Engine API를 래핑한 형태다.
프론트에서 사용하는 엔드포인트는 총 5개다.

```
GET  /api/containers?all=true          # 컨테이너 목록
GET  /api/containers/{id}/logs?tail=100 # SSE 로그 스트리밍
POST /api/containers/{id}/start
POST /api/containers/{id}/stop
POST /api/containers/{id}/restart
```

컨테이너 목록 응답 예시:

```json
{
  "id": "bdf66324b186dc82c838c2a873145ff1bd196ad2c2623c715c89e4f5918993c7",
  "shortId": "bdf66324b186",
  "names": ["/dashboard-front"],
  "image": "dashboard-front",
  "status": "Up 59 seconds",
  "state": "running",
  "created": 1774931874
}
```

---

## 프론트엔드 구현

### 프로젝트 구조

```
src/
  api.js                    # API 호출 함수
  App.js                    # 루트 컴포넌트 (목록 + 폴링)
  App.css                   # 전체 스타일 (다크 테마)
  components/
    ContainerCard.js        # 카드 UI + 액션 버튼
    LogViewer.js            # SSE 실시간 로그 모달
```

### api.js — API 호출 분리

```js
const BASE = 'http://100.109.108.36:28080';

export const fetchContainers = () =>
  fetch(`${BASE}/api/containers?all=true`).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  });

export const containerAction = (id, action) =>
  fetch(`${BASE}/api/containers/${id}/${action}`, { method: 'POST' }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r;
  });

export const getLogUrl = (id) =>
  `${BASE}/api/containers/${id}/logs?tail=100`;
```

BASE URL을 한 곳에서 관리하면 나중에 환경 변수로 빼거나 nginx 프록시로 전환할 때 편하다.

### App.js — 목록 조회 + 5초 폴링

```jsx
const POLL_INTERVAL = 5000;

export default function App() {
  const [containers, setContainers] = useState([]);
  const [logTarget, setLogTarget] = useState(null);

  const load = useCallback(async () => {
    const data = await fetchContainers();
    setContainers(data);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <>
      <div className="card-grid">
        {containers.map((c) => (
          <ContainerCard
            key={c.id}
            container={c}
            onRefresh={load}
            onViewLogs={(id, name) => setLogTarget({ id, name })}
          />
        ))}
      </div>

      {logTarget && (
        <LogViewer
          containerId={logTarget.id}
          containerName={logTarget.name}
          onClose={() => setLogTarget(null)}
        />
      )}
    </>
  );
}
```

`setInterval`을 `useEffect` 안에서 관리하고 cleanup에서 `clearInterval`을 호출해야 컴포넌트 언마운트 시 폴링이 멈춘다.

### ContainerCard.js — 카드 UI

상태(`state`)에 따라 배지 색상을 다르게 표시한다.

```js
const STATE_META = {
  running: { label: 'Running', color: '#22c55e' },
  exited:  { label: 'Exited',  color: '#ef4444' },
  paused:  { label: 'Paused',  color: '#f59e0b' },
  created: { label: 'Created', color: '#6b7280' },
  dead:    { label: 'Dead',    color: '#991b1b' },
};
```

액션 버튼은 현재 상태에 따라 비활성화한다.
- `running` 상태면 Start 버튼 비활성
- `running`이 아니면 Stop 버튼 비활성
- API 호출 중(`loading !== null`)이면 모든 버튼 비활성

```jsx
<button
  className="btn btn-green"
  disabled={isRunning || loading !== null}
  onClick={() => handleAction('start')}
>
  {loading === 'start' ? '...' : 'Start'}
</button>
```

### LogViewer.js — SSE 실시간 로그

핵심은 브라우저 내장 `EventSource` API를 사용하는 것이다.
WebSocket보다 단방향 스트리밍에 적합하고, 서버 구현도 단순하다.

```jsx
useEffect(() => {
  const es = new EventSource(getLogUrl(containerId));

  es.onopen = () => setConnected(true);

  es.onmessage = (e) => {
    setLines((prev) => {
      const next = [...prev, e.data];
      // 메모리 관리: 최대 2000줄 유지
      return next.length > 2000 ? next.slice(-2000) : next;
    });
  };

  es.onerror = () => {
    setConnected(false);
    setError('Connection lost.');
    es.close();
  };

  return () => es.close(); // cleanup: 모달 닫으면 SSE 연결 종료
}, [containerId]);
```

새 로그가 올 때마다 자동으로 최하단으로 스크롤한다.

```jsx
const bottomRef = useRef(null);

useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [lines]);

// JSX 마지막에
<div ref={bottomRef} />
```

---

## Docker Compose 배포

### 빌드 전략: 로컬 빌드 → 이미지 전송

서버에서 직접 빌드하면 node_modules 설치에 시간이 오래 걸린다.
로컬에서 이미지를 만들고 tar로 전송하는 방식을 선택했다.

**Dockerfile** (멀티스테이지 빌드)

```dockerfile
# Stage 1: React 빌드
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --silent
COPY . .
RUN npm run build

# Stage 2: nginx로 정적 파일 서빙
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

멀티스테이지 빌드를 사용하면 최종 이미지에 node, npm이 포함되지 않아 이미지 크기가 크게 줄어든다.

**nginx.conf** — SSE 버퍼링 비활성화가 핵심

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://100.109.108.36:28080;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;      # SSE 필수 설정
        proxy_cache off;
        chunked_transfer_encoding on;
    }

    location / {
        try_files $uri $uri/ /index.html;  # SPA 라우팅
    }
}
```

`proxy_buffering off`가 없으면 nginx가 SSE 응답을 버퍼에 쌓았다가 한꺼번에 보내서 실시간성이 깨진다.

**docker-compose.yml**

```yaml
services:
  dashboard-front:
    image: dashboard-front
    container_name: dashboard-front
    ports:
      - "23000:80"
    restart: unless-stopped
```

`build: .` 대신 `image: dashboard-front`를 사용한다.
로컬에서 빌드한 이미지를 그대로 쓰기 때문이다.

### 배포 순서

```bash
# 1. 로컬에서 이미지 빌드
docker build -t dashboard-front .

# 2. tar로 저장
docker save dashboard-front | gzip > dashboard-front.tar.gz

# 3. 서버로 전송
scp dashboard-front.tar.gz user@서버IP:/opt/dashboard-front/
scp docker-compose.yml user@서버IP:/opt/dashboard-front/

# 4. 서버에서 로드 & 실행
ssh user@서버IP
cd /opt/dashboard-front
docker load < dashboard-front.tar.gz
docker compose up -d
```

업데이트할 때는 1~4번을 반복하면 된다.

---

## 마무리

구현하면서 신경 쓴 포인트들:

- **SSE cleanup**: `useEffect` return에서 `es.close()` 호출하지 않으면 모달을 닫아도 서버와 연결이 유지된다.
- **메모리 관리**: 로그 줄 수를 2000줄로 제한해 장시간 열어둬도 브라우저가 버벅이지 않게 했다.
- **nginx SSE 설정**: `proxy_buffering off` 없으면 로그가 실시간으로 안 온다. 삽질 포인트.
- **멀티스테이지 빌드**: 최종 nginx 이미지는 빌드 도구 없이 정적 파일만 포함해 용량이 작다.

소스코드는 필요하면 추가로 공유할 예정이다.
