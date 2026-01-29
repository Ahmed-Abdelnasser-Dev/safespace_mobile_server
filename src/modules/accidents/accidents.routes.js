import { Router } from "express";
import { upload } from "../../middleware/upload.js";

export function createAccidentsRouter({ accidentsController }) {
  const router = Router();
  router.post(
    "/accident/report-accident",
    upload.array("media"),
    accidentsController.reportAccidentHandler,
  );
  router.post(
    "/accident/emergency-request",
    accidentsController.emergencyRequestHandler,
  );
  return router;
}

// Backward-compatible default export for app wiring
export const accidentsRouter = createAccidentsRouter({
  accidentsController: {
    reportAccidentHandler: (req, res) =>
      res.status(500).json({ message: "Router not wired" }),
    emergencyRequestHandler: (req, res) =>
      res.status(500).json({ message: "Router not wired" }),
  },
});
