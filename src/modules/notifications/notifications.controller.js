import { sendAccidentNotificationSchema } from "./notifications.validators.js";

export function createNotificationsController({ notificationsService }) {
  return {
    sendAccidentNotification: async (req, res, next) => {
      try {
        const body = sendAccidentNotificationSchema.parse(req.body);
        const result = await notificationsService.sendAccidentNotification(body);
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  };
}

