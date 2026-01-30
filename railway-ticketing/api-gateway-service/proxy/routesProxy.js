import fetch from "node-fetch";

export async function routesProxy(req, res) {
  const response = await fetch(
    `${process.env.TICKET_VALIDATION_SERVICE_URL}/routes`,
    {
      headers: {
        "X-Internal-Token": process.env.INTERNAL_SERVICE_TOKEN,
      },
    }
  );

  const data = await response.json();
  res.status(response.status).send(data);
}
