import fetch from "node-fetch";

export async function ticketProxy(req, res) {
  try {
    const response = await fetch(
      `${process.env.TICKET_VALIDATION_SERVICE_URL}/tickets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": req.headers.authorization,
          "x-internal-token": process.env.INTERNAL_SERVICE_TOKEN,
          "Idempotency-Key": req.header("Idempotency-Key"),
        },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.text();
    res.status(response.status).send(data);
  } catch (err) {
    console.error("Ticket service error:", err);
    res.status(502).json({ error: "Ticket service unavailable" });
  }
}
