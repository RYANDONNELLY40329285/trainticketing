import fetch from "node-fetch";

export async function gateProxy(req, res) {
  try {
    const response = await fetch(
      `${process.env.GATE_SCANNER_URL}/scan`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-token": process.env.INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify(req.body),
      }
    );

    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();

    res.status(response.status);

    if (contentType.includes("application/json")) {
      res.type("application/json").send(body);
    } else {
      res.type("text/plain").send(body);
    }
  } catch (err) {
    console.error("Gate service error:", err);
    res.status(502).json({
      gateAction: "DENY",
      reason: "GATE_SERVICE_UNAVAILABLE",
    });
  }
}
