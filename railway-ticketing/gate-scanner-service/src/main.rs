mod circuit_breaker;

use axum::{routing::post, Json, Router};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::time::Duration;
use tokio::net::TcpListener;
use tokio::sync::Mutex;
use dotenv::dotenv;
use once_cell::sync::Lazy;

use circuit_breaker::CircuitBreaker;



// -----------------------
// Circuit breaker (global)
// -----------------------
static BREAKER: Lazy<Mutex<CircuitBreaker>> = Lazy::new(|| {
    Mutex::new(CircuitBreaker::new(3, Duration::from_secs(10)))
});

// -----------------------
// Request / response DTOs
// -----------------------
#[derive(Serialize, Deserialize)]
struct ValidationRequest {
    ticketId: String,
    gateOrigin: String,
}

#[derive(Deserialize)]
struct ValidationResponse {
    status: String,
    reason: String,
}

#[derive(Serialize)]
struct GateResponse {
    gateAction: String,
    reason: String,
}

// -----------------------
// Gate scan handler
// -----------------------
async fn scan_ticket(
    Json(req): Json<ValidationRequest>,
) -> impl IntoResponse {

    // ---- Circuit breaker pre-check ----
    {
        let mut breaker = BREAKER.lock().await;
        if !breaker.allow_request() {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(GateResponse {
                    gateAction: "DENY".into(),
                    reason: "VALIDATION_SERVICE_UNAVAILABLE".into(),
                }),
            );
        }
    }

    // ---- HTTP client ----
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .unwrap();

    // ---- Load secrets / URLs from env ----
    let token = std::env::var("INTERNAL_SERVICE_TOKEN")
        .expect("INTERNAL_SERVICE_TOKEN must be set");

    let validation_base =
        std::env::var("TICKET_VALIDATION_SERVICE_URL")
            .expect("TICKET_VALIDATION_SERVICE_URL must be set");

    let validation_url = format!("{}/validate", validation_base);

    // ---- Call ticket-validation-service ----
    let response = client
        .post(validation_url)
        .header("X-Internal-Token", token)
        .json(&req)
        .send()
        .await;

    let mut breaker = BREAKER.lock().await;

    // ---- Handle response ----
    match response {
        Ok(resp) => {
            let raw_body = resp.text().await.unwrap_or_default();
            let body = raw_body.trim();

            // 1 Try JSON response
            if let Ok(parsed) = serde_json::from_str::<ValidationResponse>(body) {
                breaker.on_success();

                let action = if parsed.status == "VALID" {
                    "OPEN"
                } else {
                    "DENY"
                };

                return (
                    StatusCode::OK,
                    Json(GateResponse {
                        gateAction: action.into(),
                        reason: parsed.reason,
                    }),
                );
            }

            // 2 Fallback: plain text ("VALID OK")
            let parts: Vec<&str> = body.split_whitespace().collect();
            if parts.len() >= 2 {
                breaker.on_success();

                let status = parts[0];
                let reason = parts[1..].join(" ");

                let action = if status == "VALID" {
                    "OPEN"
                } else {
                    "DENY"
                };

                return (
                    StatusCode::OK,
                    Json(GateResponse {
                        gateAction: action.into(),
                        reason,
                    }),
                );
            }

            // 3Invalid response
            breaker.on_failure();
            (
                StatusCode::BAD_GATEWAY,
                Json(GateResponse {
                    gateAction: "DENY".into(),
                    reason: "INVALID_VALIDATION_RESPONSE".into(),
                }),
            )
        }

        // ---- Timeout / network failure ----
        Err(_) => {
            breaker.on_failure();
            (
                StatusCode::GATEWAY_TIMEOUT,
                Json(GateResponse {
                    gateAction: "DENY".into(),
                    reason: "VALIDATION_SERVICE_TIMEOUT".into(),
                }),
            )
        }
    }
}



// -----------------------
// App entry point
// -----------------------
#[tokio::main]
async fn main() {
    dotenv().ok();

    let app = Router::new()
        .route("/scan", post(scan_ticket));

    let addr = SocketAddr::from(([0, 0, 0, 0], 8090));
    println!("Gate scanner running on {}", addr);

    let listener = TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
