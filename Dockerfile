# ─────────────────────────────────────────────────────────────────────────────
# MediFlowIQ — Backend Dockerfile
# Multi-stage build: Maven build → slim JRE 21 runtime
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /build

# Copy dependency manifests first so Docker can cache the dependency layer
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copy the full backend source and build the fat JAR (skip tests for speed)
COPY backend/src ./src
RUN mvn package -DskipTests -B

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

# Non-root user for security
RUN addgroup -S mediflow && adduser -S mediflow -G mediflow
USER mediflow

WORKDIR /app

# Copy the packaged JAR from the build stage
COPY --from=builder /build/target/*.jar app.jar

# Expose the Spring Boot default port
EXPOSE 8080

# Health-check: poll the actuator endpoint every 30 s
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
