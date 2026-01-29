import { Router } from "express";

import { createAccidentsRouter } from "./modules/accidents/accidents.routes.js";
import { createCentralUnitRouter } from "./modules/centralUnit/centralUnit.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";

import { getPrisma } from "./db/prisma.js";
import { createAccidentsRepo } from "./modules/accidents/accidents.repo.js";
import { createAccidentsService } from "./modules/accidents/accidents.service.js";
import { createAccidentsController } from "./modules/accidents/accidents.controller.js";
import { createCentralUnitRepo } from "./modules/centralUnit/centralUnit.repo.js";
import { createCentralUnitService } from "./modules/centralUnit/centralUnit.service.js";
import { createCentralUnitController } from "./modules/centralUnit/centralUnit.controller.js";
import { createNotificationsService } from "./modules/notifications/notifications.service.js";
import { createAuthRepo } from "./modules/auth/auth.repo.js";
import { createAuthService } from "./modules/auth/auth.service.js";
import { createAuthController } from "./modules/auth/auth.controller.js";

export function createRoutes(deps = {}) {
  const router = Router();

  const prisma = deps.prisma || getPrisma();

  const centralUnitService =
    deps.centralUnitService ||
    createCentralUnitService({
      centralUnitRepo: createCentralUnitRepo(prisma),
      accidentsRepo: createAccidentsRepo(prisma),
      notificationsService: deps.notificationsService || createNotificationsService({ prisma }),
    });

  const accidentsService =
    deps.accidentsService ||
    createAccidentsService({
      accidentsRepo: createAccidentsRepo(prisma),
      centralUnitService,
    });

  // Keep modules mounted at root to match required paths
  if (deps.authController) {
    router.use(createAuthRouter({ authController: deps.authController }));
  } else if (deps.authService) {
    router.use(createAuthRouter({ authController: createAuthController({ authService: deps.authService }) }));
  } else {
    // Default runtime wiring
    const authService = createAuthService({ authRepo: createAuthRepo(prisma) });
    router.use(createAuthRouter({ authController: createAuthController({ authService }) }));
  }
  router.use(
    createAccidentsRouter({
      accidentsController: createAccidentsController({ accidentsService }),
    })
  );
  router.use(
    createCentralUnitRouter({
      centralUnitController: createCentralUnitController({ centralUnitService }),
    })
  );
  router.use(notificationsRouter);

  return router;
}

