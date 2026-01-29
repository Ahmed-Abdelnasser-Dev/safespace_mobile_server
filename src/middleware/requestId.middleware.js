import { randomUUID } from "node:crypto";

export function requestIdMiddleware(req, res, next) {
  const header = req.headers["x-request-id"];
  const requestId = (typeof header === "string" && header.trim()) || randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

