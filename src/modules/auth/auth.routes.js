import { Router } from "express";
import { 
  authRateLimiter, 
  emailVerificationRateLimiter,
  refreshTokenRateLimiter 
} from "../../middleware/rateLimit.middleware.js";

export function createAuthRouter({ authController }) {
  const router = Router();
  
  // Auth endpoints with strict rate limiting
  router.post("/auth/register", authRateLimiter, authController.register);
  router.post("/auth/login", authRateLimiter, authController.login);
  
  // Token management with moderate rate limiting
  router.post("/auth/refresh-token", refreshTokenRateLimiter, authController.refresh);
  router.post("/auth/logout", authController.logout);
  router.post("/auth/update-fcm-token", authController.updateFcmToken);
  
  // Email verification with rate limiting
  router.post("/auth/verify-email", authController.verifyEmail);
  router.post("/auth/resend-verification", emailVerificationRateLimiter, authController.resendVerificationEmail);
  
  return router;
}

export const authRouter = createAuthRouter({
  authController: {
    register: (req, res) => res.status(500).json({ message: "Router not wired" }),
    login: (req, res) => res.status(500).json({ message: "Router not wired" }),
    refresh: (req, res) => res.status(500).json({ message: "Router not wired" }),
    logout: (req, res) => res.status(500).json({ message: "Router not wired" }),
    updateFcmToken: (req, res) => res.status(500).json({ message: "Router not wired" }),
    verifyEmail: (req, res) => res.status(500).json({ message: "Router not wired" }),
    resendVerificationEmail: (req, res) => res.status(500).json({ message: "Router not wired" })
  }
});

