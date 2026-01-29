import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

const TICKET_SERVICE = "http://localhost:8080";
const GATE_SERVICE = "http://localhost:8090";

// Create ticket
app.post("/tickets", async (req, res) => {
  try {
    const response = await axios.post(
      `${TICKET_SERVICE}/tickets`,
      req.body,
      { headers: { "Idempotency-Key": req.headers["idempotency-key"] } }
    );
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || {});
  }
});

// Scan ticket
app.post("/scan", async (req, res) => {
  try {
    const response = await axios.post(
      `${GATE_SERVICE}/scan`,
      req.body
    );
    res.json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json(err.response?.data || {});
  }
});

app.listen(3000, () => {
  console.log("API Gateway running on :3000");
});
