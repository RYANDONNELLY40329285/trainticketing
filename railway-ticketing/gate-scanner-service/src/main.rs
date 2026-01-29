mod circuit_breaker;

use axum::{routing::post, Json, Router};
use axum::http::StatusCode;
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::time::Duration;
use tokio::net::TcpListener;
use tokio::sync::Mutex;
use axum::response::IntoResponse;

use once_cell::sync::Lazy;
use circuit_breaker::CircuitBreaker;

const VALIDATION_SERVICE_URL: &str = "http://localhost:8080/validate";

static BREAKER: Lazy<Mutex<CircuitBreaker>> = Lazy::new(|| {
    Mutex::new(CircuitBreaker::new(3, Duration::from_secs(10)))
});

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

async fn scan_ticket(
    Json(req): Json<ValidationRequest>,
) -> impl IntoResponse{

 
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

  
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .unwrap();

    let response = client
        .post(VALIDATION_SERVICE_URL)
        .json(&req)
        .send()
        .await;

 
    let mut breaker = BREAKER.lock().await;

    match response {
        Ok(resp) => match resp.json::<ValidationResponse>().await {
            Ok(body) => {
                breaker.on_success();

                let action = if body.status == "VALID" {
                    "OPEN"
                } else {
                    "DENY"
                };

                (
                    StatusCode::OK,
                    Json(GateResponse {
                        gateAction: action.into(),
                        reason: body.reason,
                    }),
                )
            }
            Err(_) => {
                breaker.on_failure();
                (
                    StatusCode::BAD_GATEWAY,
                    Json(GateResponse {
                        gateAction: "DENY".into(),
                        reason: "INVALID_VALIDATION_RESPONSE".into(),
                    }),
                )
            }
        },
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

#[tokio::main]
async fn main() {
    let app = Router::new().route("/scan", post(scan_ticket));

    let addr = SocketAddr::from(([0, 0, 0, 0], 8090));
    println!("Gate scanner running on {}", addr);

    let listener = TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
