# Stage 1: Build the application using Gradle
FROM gradle:8.5-jdk17 AS build
WORKDIR /app

# Copy the build configuration and code
COPY --chown=gradle:gradle . .

# Build the main bootable JAR module (travel-api)
RUN gradle :travel-api:bootJar --no-daemon

# Stage 2: Create a minimal JRE runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the compiled JAR from the build stage
COPY --from=build /app/travel-api/build/libs/travel-api-0.0.1-SNAPSHOT.jar app.jar

# Expose port 8080 and define entrypoint
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
