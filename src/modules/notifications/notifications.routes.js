import { Router } from "express";
import { createNotificationsController } from "./notifications.controller.js";
import { createNotificationsService } from "./notifications.service.js";
import { getPrisma } from "../../db/prisma.js";

export const notificationsRouter = Router();

const prisma = getPrisma();
const controller = createNotificationsController({
  notificationsService: createNotificationsService({ prisma }),
});

notificationsRouter.post("/notifications/send-accident-notification", controller.sendAccidentNotification);

