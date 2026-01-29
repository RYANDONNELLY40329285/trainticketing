import jwt from "jsonwebtoken";

export function jwtAuth(req, res, next) {
  const auth = req.header("Authorization");

  if (!auth) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = auth.replace("Bearer ", "");

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
