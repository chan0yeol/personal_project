FROM gradle:8.8-jdk17-alpine AS builder

WORKDIR /app
COPY build.gradle settings.gradle ./
COPY src src

RUN gradle bootJar -x test --no-daemon

FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
