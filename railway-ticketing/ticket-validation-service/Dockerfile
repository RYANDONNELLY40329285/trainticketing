FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy go module files first (cache-friendly)
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the source
COPY . .

# Build the server entrypoint
RUN go build -o ticket-validation ./cmd/server

FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/ticket-validation .

EXPOSE 8080
CMD ["./ticket-validation"]
