import { createHash, timingSafeEqual } from "node:crypto";

export function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

export function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

