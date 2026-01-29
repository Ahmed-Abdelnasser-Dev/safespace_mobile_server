import { Router } from "express";

export function createAuthRouter({ authController }) {
  const router = Router();
  router.post("/auth/register", authController.register);
  router.post("/auth/login", authController.login);
  router.post("/auth/refresh-token", authController.refresh);
  router.post("/auth/logout", authController.logout);
  return router;
}

export const authRouter = createAuthRouter({
  authController: {
    register: (req, res) => res.status(500).json({ message: "Router not wired" }),
    login: (req, res) => res.status(500).json({ message: "Router not wired" }),
    refresh: (req, res) => res.status(500).json({ message: "Router not wired" }),
    logout: (req, res) => res.status(500).json({ message: "Router not wired" })
  }
});

