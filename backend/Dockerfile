# Use a lightweight JRE 17 Alpine image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the pre-compiled JAR from the build output directory
COPY travel-api/build/libs/travel-api-0.0.1-SNAPSHOT.jar app.jar

# Expose the application port
EXPOSE 8080

# Execute the application
ENTRYPOINT ["java", "-jar", "app.jar"]
