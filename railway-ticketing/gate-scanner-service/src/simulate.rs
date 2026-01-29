use reqwest::Client;
use serde_json::json;
use std::time::Duration;

pub async fn simulate_gates(ticket_id: &str, origin: &str, gates: usize) {
    let client = Client::new();
    let mut handles = Vec::new();

    for gate_id in 0..gates {
        let client = client.clone();
        let ticket_id = ticket_id.to_string();
        let origin = origin.to_string();

        handles.push(tokio::spawn(async move {
            let res = client
                .post("http://localhost:8090/scan")
                .json(&json!({
                    "ticketId": ticket_id,
                    "gateOrigin": origin
                }))
                .send()
                .await;

            println!("Gate {} → {:?}", gate_id, res.map(|r| r.status()));
        }));
    }

    for h in handles {
        let _ = h.await;
    }
}
