import dotenv from "dotenv";
dotenv.config();

import express from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

function internalAuth(req, res, next) {
  if (req.headers["x-internal-token"] !== process.env.INTERNAL_SERVICE_TOKEN) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

// LOGIN ENDPOINT (INTERNAL ONLY)
app.post("/login", internalAuth, (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Missing username" });
  }

  const token = jwt.sign(
    {
      sub: username,
      role: "passenger",
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  res.json({ accessToken: token });
});

app.listen(4000, () =>
  console.log("Auth service running on http://localhost:4000")
);
