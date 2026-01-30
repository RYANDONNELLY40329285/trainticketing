import dotenv from "dotenv";
dotenv.config(); 
 import cors from "cors";
import express from "express";
import bodyParser from "body-parser";

import { apiKeyAuth } from "./auth/apiKeyAuth.js";
import { jwtAuth } from "./auth/jwtAuth.js";
import { ticketProxy } from "./proxy/ticketProxy.js";
import { gateProxy } from "./proxy/gateProxy.js";
import { routesProxy } from "./proxy/routesProxy.js";


const app = express();


app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "Idempotency-Key"],
}));
app.use(bodyParser.json());

// USER FLOW (JWT)
app.post("/tickets", jwtAuth, ticketProxy);

// GATE FLOW (API KEY)
app.post("/scan", apiKeyAuth, gateProxy);

//routes 
app.get("/routes", routesProxy);


app.post("/auth/login", async (req, res) => {
  try {
    const response = await fetch(
      `${process.env.AUTH_SERVICE_URL}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-token": process.env.INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Auth service error:", err);
    res.status(502).json({ error: "Auth service unavailable" });
  }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`API Gateway running on http://localhost:${PORT}`)
);


