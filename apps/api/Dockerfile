# syntax=docker/dockerfile:1

# --- build stage ---
FROM golang:1.26 AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# --- run stage ---
FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app

COPY --from=build /out/server /app/server
COPY --from=build /src/migrations /app/migrations

EXPOSE 3000

USER nonroot:nonroot

ENTRYPOINT ["/app/server"]
