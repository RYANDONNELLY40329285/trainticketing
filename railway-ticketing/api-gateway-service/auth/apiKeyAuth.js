export function apiKeyAuth(req, res, next) {
  const key = req.header("X-API-Key");


  if (!key || key !== process.env.API_GATE_KEY) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  next();
}
