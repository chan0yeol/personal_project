FROM gradle:8.7-jdk17 AS build
WORKDIR /app
COPY build.gradle .
COPY settings.gradle .
RUN gradle dependencies --no-daemon
COPY src src
RUN gradle bootJar -x test --no-daemon

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
