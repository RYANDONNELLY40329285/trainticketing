import dotenv from "dotenv";
dotenv.config(); 

import express from "express";
import bodyParser from "body-parser";

import { apiKeyAuth } from "./auth/apiKeyAuth.js";
import { jwtAuth } from "./auth/jwtAuth.js";
import { ticketProxy } from "./proxy/ticketProxy.js";
import { gateProxy } from "./proxy/gateProxy.js";

const app = express();
app.use(bodyParser.json());

// USER FLOW (JWT)
app.post("/tickets", jwtAuth, ticketProxy);

// GATE FLOW (API KEY)
app.post("/scan", apiKeyAuth, gateProxy);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`API Gateway running on http://localhost:${PORT}`)
);
