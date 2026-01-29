import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { sha256Hex, safeEqual } from "../../utils/crypto.js";
import { getEnv } from "../../config/env.js";

function makeError(statusCode, code, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  err.expose = true;
  return err;
}

function parseTtlToMs(ttl) {
  // supports e.g. "15m", "30d", or milliseconds as number string
  if (typeof ttl === "number") return ttl;
  if (/^\d+$/.test(ttl)) return Number(ttl);
  const m = String(ttl).match(/^(\d+)([smhd])$/);
  if (!m) return 0;
  const n = Number(m[1]);
  const unit = m[2];
  const mult = unit === "s" ? 1000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return n * mult;
}

export function createAuthService({ authRepo }) {
  const env = getEnv();
  const accessSecret = env.JWT_ACCESS_SECRET;
  const refreshSecret = env.JWT_REFRESH_SECRET;
  const accessTtl = env.JWT_ACCESS_TTL || "15m";
  const refreshTtl = env.JWT_REFRESH_TTL || "30d";

  if (!accessSecret || !refreshSecret) {
    throw new Error("JWT secrets are not configured (JWT_ACCESS_SECRET/JWT_REFRESH_SECRET)");
  }

  function signAccessToken({ userId }) {
    return jwt.sign({ sub: userId }, accessSecret, { expiresIn: accessTtl });
  }

  function signRefreshToken({ userId, sessionId }) {
    return jwt.sign({ sub: userId, sid: sessionId }, refreshSecret, { expiresIn: refreshTtl });
  }

  function verifyRefreshToken(token) {
    return jwt.verify(token, refreshSecret);
  }

  return {
    async register({ email, password, fullName, phone }) {
      const existing = await authRepo.findUserByEmail(email);
      if (existing) throw makeError(409, "CONFLICT", "Email already in use");

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await authRepo.createUser({ email, passwordHash, fullName, phone });

      const accessToken = signAccessToken({ userId: user.id });
      // Create an initial session so client can refresh immediately.
      const expiresAt = new Date(Date.now() + parseTtlToMs(refreshTtl));
      const session = await authRepo.createSession({
        userId: user.id,
        deviceId: null,
        fcmToken: null,
        refreshTokenHash: "pending",
        expiresAt,
      });

      const refreshToken = signRefreshToken({ userId: user.id, sessionId: session.id });
      await authRepo.updateSessionRefreshHash(session.id, sha256Hex(refreshToken));

      return { user, accessToken, refreshToken };
    },

    async login({ email, password, deviceId, fcmToken }) {
      const user = await authRepo.findUserByEmail(email);
      if (!user) throw makeError(401, "UNAUTHORIZED", "Invalid credentials");

      const ok = await bcrypt.compare(password, user.passwordHash || "");
      if (!ok) throw makeError(401, "UNAUTHORIZED", "Invalid credentials");

      const accessToken = signAccessToken({ userId: user.id });
      const expiresAt = new Date(Date.now() + parseTtlToMs(refreshTtl));
      const session = await authRepo.createSession({
        userId: user.id,
        deviceId,
        fcmToken,
        refreshTokenHash: "pending",
        expiresAt,
      });
      const refreshToken = signRefreshToken({ userId: user.id, sessionId: session.id });
      await authRepo.updateSessionRefreshHash(session.id, sha256Hex(refreshToken));

      return {
        user: { id: user.id, email: user.email, fullName: user.fullName },
        accessToken,
        refreshToken,
      };
    },

    async refresh({ refreshToken }) {
      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch {
        throw makeError(401, "UNAUTHORIZED", "Invalid refresh token");
      }

      const userId = payload.sub;
      const sessionId = payload.sid;
      if (!userId || !sessionId) throw makeError(401, "UNAUTHORIZED", "Invalid refresh token");

      const session = await authRepo.findSessionById(sessionId);
      if (!session) throw makeError(401, "UNAUTHORIZED", "Invalid refresh token");

      const presentedHash = sha256Hex(refreshToken);
      if (!safeEqual(session.refreshTokenHash, presentedHash)) {
        // Potential token theft or mismatched token
        throw makeError(401, "UNAUTHORIZED", "Invalid refresh token");
      }

      if (session.revokedAt) {
        // Reuse detected -> revoke all sessions for user
        await authRepo.revokeAllUserSessions(userId);
        throw makeError(401, "UNAUTHORIZED", "Refresh token reuse detected");
      }

      if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
        await authRepo.revokeSession(sessionId);
        throw makeError(401, "UNAUTHORIZED", "Refresh token expired");
      }

      // rotate
      await authRepo.revokeSession(sessionId);
      const accessToken = signAccessToken({ userId });
      const expiresAt = new Date(Date.now() + parseTtlToMs(refreshTtl));
      const newSession = await authRepo.createSession({
        userId,
        deviceId: session.deviceId,
        fcmToken: session.fcmToken,
        refreshTokenHash: "pending",
        expiresAt,
      });
      const newRefreshToken = signRefreshToken({ userId, sessionId: newSession.id });
      await authRepo.updateSessionRefreshHash(newSession.id, sha256Hex(newRefreshToken));

      return { accessToken, refreshToken: newRefreshToken };
    },

    async logout({ refreshToken }) {
      let payload;
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch {
        return { ok: true };
      }
      const sessionId = payload.sid;
      if (sessionId) {
        try {
          await authRepo.revokeSession(sessionId);
        } catch {
          // ignore
        }
      }
      return { ok: true };
    },
  };
}

