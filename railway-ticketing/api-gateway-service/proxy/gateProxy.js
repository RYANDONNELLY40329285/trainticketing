import fetch from "node-fetch";

export async function gateProxy(req, res) {
  const response = await fetch("http://localhost:8090/scan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.text();
  res.status(response.status).send(data);
}
