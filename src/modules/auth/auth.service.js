import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

import { sha256Hex, safeEqual } from "../../utils/crypto.js";
import { getEnv } from "../../config/env.js";

// Security constants
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const ACCOUNT_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

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
      if (existing) throw makeError(409, "CONFLICT", "User already exists");

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await authRepo.createUser({ email, passwordHash, fullName, phone });

      // Generate email verification token
      const verificationToken = randomBytes(32).toString("hex");
      const verificationExpiry = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS);
      await authRepo.createEmailVerificationToken(user.id, verificationToken, verificationExpiry);

      // TODO: Send verification email with token
      // For now, we'll return the token in response (REMOVE IN PRODUCTION)
      
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

      return { 
        user, 
        accessToken, 
        refreshToken,
        emailVerificationToken: verificationToken, // TEMP: Remove in production
        message: "Please verify your email address"
      };
    },

    async login({ email, password, deviceId, fcmToken, ipAddress, userAgent }) {
      const user = await authRepo.findUserByEmail(email);
      
      // Check if account is locked
      if (user?.accountLockedUntil) {
        if (new Date(user.accountLockedUntil) > new Date()) {
          const remainingMinutes = Math.ceil(
            (new Date(user.accountLockedUntil).getTime() - Date.now()) / 60000
          );
          throw makeError(
            403,
            "ACCOUNT_LOCKED",
            `Account is locked. Try again in ${remainingMinutes} minutes`
          );
        } else {
          // Lock has expired, unlock the account
          await authRepo.unlockUserAccount(user.id);
        }
      }

      // Validate credentials
      if (!user) {
        // Record failed attempt even for non-existent users (don't reveal if user exists)
        await authRepo.recordLoginAttempt({
          userId: null,
          email,
          ipAddress: ipAddress || "unknown",
          userAgent: userAgent || "unknown",
          successful: false,
        });
        throw makeError(401, "UNAUTHORIZED", "Invalid credentials");
      }

      const ok = await bcrypt.compare(password, user.passwordHash || "");
      
      if (!ok) {
        // Record failed attempt
        await authRepo.recordLoginAttempt({
          userId: user.id,
          email,
          ipAddress: ipAddress || "unknown",
          userAgent: userAgent || "unknown",
          successful: false,
        });

        // Check if we should lock the account
        const sinceDate = new Date(Date.now() - LOGIN_ATTEMPT_WINDOW_MS);
        const failedAttempts = await authRepo.getRecentFailedLoginAttempts(email, sinceDate);

        if (failedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
          const lockUntil = new Date(Date.now() + ACCOUNT_LOCK_DURATION_MS);
          await authRepo.lockUserAccount(user.id, lockUntil);
          throw makeError(
            403,
            "ACCOUNT_LOCKED",
            `Too many failed login attempts. Account locked for ${ACCOUNT_LOCK_DURATION_MS / 60000} minutes`
          );
        }

        throw makeError(401, "UNAUTHORIZED", "Invalid credentials");
      }

      // Successful login - record it
      await authRepo.recordLoginAttempt({
        userId: user.id,
        email,
        ipAddress: ipAddress || "unknown",
        userAgent: userAgent || "unknown",
        successful: true,
      });

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
        user: { 
          id: user.id, 
          email: user.email, 
          fullName: user.fullName,
          emailVerified: user.emailVerified 
        },
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

    async updateFcmToken({ sessionId, fcmToken }) {
      const session = await authRepo.findSessionById(sessionId);
      if (!session) {
        throw makeError(404, "NOT_FOUND", "Session not found");
      }

      if (session.revokedAt) {
        throw makeError(401, "UNAUTHORIZED", "Session has been revoked");
      }

      const updated = await authRepo.updateSessionFcmToken(sessionId, fcmToken);
      return { ok: true, fcmToken: updated.fcmToken };
    },

    async verifyEmail({ token }) {
      const user = await authRepo.findUserByVerificationToken(token);
      
      if (!user) {
        throw makeError(400, "INVALID_TOKEN", "Invalid or expired verification token");
      }

      if (user.emailVerificationExpires && new Date(user.emailVerificationExpires) < new Date()) {
        throw makeError(400, "TOKEN_EXPIRED", "Verification token has expired");
      }

      if (user.emailVerified) {
        throw makeError(400, "ALREADY_VERIFIED", "Email already verified");
      }

      await authRepo.markEmailAsVerified(user.id);

      return { 
        ok: true, 
        message: "Email verified successfully",
        user: {
          id: user.id,
          email: user.email,
          emailVerified: true
        }
      };
    },

    async resendVerificationEmail({ email }) {
      const user = await authRepo.findUserByEmail(email);
      
      if (!user) {
        // Don't reveal if email exists
        return { ok: true, message: "If the email exists, a verification link has been sent" };
      }

      if (user.emailVerified) {
        throw makeError(400, "ALREADY_VERIFIED", "Email already verified");
      }

      // Generate new verification token
      const verificationToken = randomBytes(32).toString("hex");
      const verificationExpiry = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS);
      await authRepo.createEmailVerificationToken(user.id, verificationToken, verificationExpiry);

      // TODO: Send verification email

      return { 
        ok: true, 
        message: "Verification email sent",
        emailVerificationToken: verificationToken // TEMP: Remove in production
      };
    },
  };
}

