# ---------- Build stage ----------
FROM rust:latest AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

# ---------- Runtime stage ----------
FROM debian:bookworm-slim


RUN apt-get update && \
    apt-get install -y libssl3 ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/release/gate-scanner-service .

EXPOSE 8090
CMD ["./gate-scanner-service"]
