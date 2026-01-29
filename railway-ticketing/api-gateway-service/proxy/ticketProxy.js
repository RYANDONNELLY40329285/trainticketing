import fetch from "node-fetch";

export async function ticketProxy(req, res) {
  const response = await fetch("http://localhost:8080/tickets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": req.header("Idempotency-Key"),
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.text();
  res.status(response.status).send(data);
}
