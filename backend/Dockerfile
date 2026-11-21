# syntax=docker/dockerfile:1

FROM golang:1.27-alpine AS base
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .

# ---------- DEV ----------
FROM base AS dev
RUN go install github.com/air-verse/air@latest
ENV GIN_MODE=debug
EXPOSE 8080
CMD ["air", "-c", ".air.toml"]

# ---------- BUILD ----------
FROM base AS build
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

# ---------- PRODUCTION ----------
FROM alpine:3.22 AS production
RUN apk add --no-cache ca-certificates \
    && adduser -D -H -u 10001 app
WORKDIR /app
COPY --from=build /out/api /app/api
USER app
EXPOSE 8080
ENV GIN_MODE=release
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/v1/health || exit 1
ENTRYPOINT ["/app/api"]
