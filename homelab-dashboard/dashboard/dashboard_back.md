+++
title = "Spring Boot + Docker API로 홈서버 모니터링 대시보드 만들기"
date = 2026-03-31
description = "Spring Boot 3.5와 docker-java 라이브러리를 활용해 홈서버의 Docker 컨테이너를 모니터링하는 대시보드 백엔드를 구축하는 방법을 단계별로 설명합니다."
tags = ["spring-boot", "docker", "homelab", "java", "sse", "모니터링"]
categories = ["개발", "홈랩"]
keywords = ["spring boot docker 연동", "docker-java", "홈서버 모니터링", "컨테이너 로그 스트리밍", "SSE", "homelab dashboard"]
draft = false
+++

홈서버에서 여러 Docker 컨테이너를 운영하다 보면 매번 SSH 접속해서 `docker ps`, `docker logs` 치는 게 번거롭다. 그래서 직접 모니터링 대시보드를 만들어보기로 했다.

이 글에서는 **백엔드(Spring Boot)** 구축 과정을 다룬다. 프론트엔드(React)는 다음 글에서 이어간다.

## 기술 스택

- **Backend**: Spring Boot 3.5, Java 17, Maven
- **Docker 연동**: docker-java 3.3.6 (zerodep transport)
- **실시간 로그**: SSE (Server-Sent Events) + WebFlux
- **배포**: Docker 컨테이너로 홈서버에 올리기

---

## 프로젝트 구조

```
com.chanyeols.dashboard
├── config/
│   └── DockerConfig.java        # DockerClient 빈 설정
└── container/
    ├── controller/
    │   └── ContainerController.java
    ├── service/
    │   └── ContainerService.java
    └── dto/
        └── ContainerSummaryDto.java
```

---

## 1. 의존성 설정 (pom.xml)

Spring Boot Web, WebFlux에 docker-java를 추가한다.

```xml
<!-- Docker Java -->
<dependency>
    <groupId>com.github.docker-java</groupId>
    <artifactId>docker-java</artifactId>
    <version>3.3.6</version>
</dependency>
<dependency>
    <groupId>com.github.docker-java</groupId>
    <artifactId>docker-java-transport-zerodep</artifactId>
    <version>3.3.6</version>
</dependency>
```

> **transport 선택**: `httpclient5` 트랜스포트는 Unix 소켓을 제대로 처리하지 못해 `Connect to unix://localhost:2375 failed` 에러가 발생한다. **zerodep 트랜스포트**를 써야 `/var/run/docker.sock` 연결이 정상 동작한다.

---

## 2. DockerClient 빈 설정

```java
@Configuration
public class DockerConfig {

    @Value("${docker.host:unix:///var/run/docker.sock}")
    private String dockerHost;

    @Bean
    public DockerClient dockerClient() {
        DockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder()
                .withDockerHost(dockerHost)
                .build();

        DockerHttpClient httpClient = new ZerodepDockerHttpClient.Builder()
                .dockerHost(config.getDockerHost())
                .sslConfig(config.getSSLConfig())
                .build();

        return DockerClientImpl.getInstance(config, httpClient);
    }
}
```

`application.properties`:
```properties
docker.host=unix:///var/run/docker.sock
```

---

## 3. 컨테이너 목록 조회

```java
public List<ContainerSummaryDto> listContainers(boolean all) {
    return dockerClient.listContainersCmd()
            .withShowAll(all)
            .exec()
            .stream()
            .map(this::toDto)
            .toList();
}
```

DTO는 ID, 이름, 이미지, 상태, 생성 시간을 담는다.

---

## 4. 실시간 로그 스트리밍 (SSE)

이 프로젝트의 핵심 기능이다. docker-java의 콜백 기반 API를 WebFlux의 `Flux`로 브리징한다.

```java
public Flux<String> streamLogs(String containerId, int tail) {
    return Flux.create(sink -> {
        dockerClient.logContainerCmd(containerId)
                .withStdOut(true)
                .withStdErr(true)
                .withFollowStream(true)
                .withTail(tail)
                .withTimestamps(true)
                .exec(new ResultCallback.Adapter<>() {
                    @Override
                    public void onNext(Frame frame) {
                        sink.next(new String(frame.getPayload()).stripTrailing());
                    }

                    @Override
                    public void onError(Throwable throwable) {
                        sink.error(throwable);
                    }

                    @Override
                    public void onComplete() {
                        sink.complete();
                    }
                });
    });
}
```

컨트롤러에서 SSE로 내보낸다:

```java
@GetMapping(value = "/{id}/logs", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<String>> streamLogs(@PathVariable String id,
                                                 @RequestParam(defaultValue = "100") int tail) {
    return containerService.streamLogs(id, tail)
            .map(line -> ServerSentEvent.<String>builder().data(line).build());
}
```

---

## 5. 컨테이너 제어 API

시작 / 정지 / 재시작은 간단하다:

```java
public void startContainer(String containerId) {
    dockerClient.startContainerCmd(containerId).exec();
}

public void stopContainer(String containerId) {
    dockerClient.stopContainerCmd(containerId).exec();
}

public void restartContainer(String containerId) {
    dockerClient.restartContainerCmd(containerId).exec();
}
```

---

## 6. API 목록

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/containers?all=true` | 컨테이너 목록 |
| GET | `/api/containers/{id}/logs?tail=100` | SSE 로그 스트리밍 |
| POST | `/api/containers/{id}/start` | 시작 |
| POST | `/api/containers/{id}/stop` | 정지 |
| POST | `/api/containers/{id}/restart` | 재시작 |

---

## 7. Docker로 배포하기

홈서버에서 컨테이너로 실행하면 별도 Java 설치가 필요 없다.

**Dockerfile** (멀티 스테이지 빌드):

```dockerfile
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -q
COPY src/ src/
RUN ./mvnw package -DskipTests -q

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**docker-compose.yml**:

```yaml
services:
  dashboard:
    image: dashboard
    container_name: dashboard
    ports:
      - "28080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
```

`/var/run/docker.sock` 볼륨 마운트가 핵심이다. 이걸 통해 컨테이너 안에서 호스트의 Docker 데몬에 접근한다.

**배포 플로우** (PC에서 빌드 → 홈서버로 전송):

```bash
# PC에서
docker build -t dashboard .
docker save dashboard -o dashboard.tar
scp dashboard.tar user@홈서버IP:~/dashboard/

# 홈서버에서
docker load < dashboard.tar
docker compose up -d --force-recreate
```

---

## 마치며

Spring Boot + docker-java 조합으로 Docker 소켓을 통해 컨테이너를 제어하는 백엔드를 만들었다. SSE를 활용한 실시간 로그 스트리밍이 이 프로젝트의 핵심으로, `Flux.create()`로 docker-java의 콜백을 리액티브 스트림으로 감싸는 방식이 깔끔하게 동작한다.

다음 글에서는 React로 프론트엔드를 구성하고 실제 UI를 붙이는 과정을 다룬다.
+++
