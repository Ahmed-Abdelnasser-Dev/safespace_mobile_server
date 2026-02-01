import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";

/**
 * Create profile router with all /me/* endpoints
 * All endpoints are protected by requireAuth middleware
 */
export function createProfileRouter({ profileController }) {
  const router = Router();

  // Complete profile endpoint
  router.get("/me/profile", requireAuth, profileController.getProfile);

  // Medical information endpoints
  router.get("/me/medical-info", requireAuth, profileController.getMedicalInfo);
  router.put("/me/medical-info", requireAuth, profileController.updateMedicalInfo);

  // Identification data endpoints
  router.get("/me/identification", requireAuth, profileController.getIdentification);
  router.put("/me/identification", requireAuth, profileController.updateIdentification);

  // Personal information endpoints
  router.get("/me/personal-info", requireAuth, profileController.getPersonalInfo);
  router.patch("/me/personal-info", requireAuth, profileController.updatePersonalInfo);

  return router;
}

// Backward-compatible default export for app wiring
export const profileRouter = createProfileRouter({
  profileController: {
    getProfile: (req, res) => res.status(500).json({ message: "Router not wired" }),
    getMedicalInfo: (req, res) => res.status(500).json({ message: "Router not wired" }),
    updateMedicalInfo: (req, res) => res.status(500).json({ message: "Router not wired" }),
    getIdentification: (req, res) => res.status(500).json({ message: "Router not wired" }),
    updateIdentification: (req, res) => res.status(500).json({ message: "Router not wired" }),
    getPersonalInfo: (req, res) => res.status(500).json({ message: "Router not wired" }),
    updatePersonalInfo: (req, res) => res.status(500).json({ message: "Router not wired" }),
  },
});
