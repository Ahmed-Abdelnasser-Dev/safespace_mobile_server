import { createFcmProvider } from "./fcm.provider.js";

export function createNotificationsService({ prisma, provider = createFcmProvider() }) {
  return {
    async sendAccidentNotification({ accidentId, userIds, title, body, streetName, data }) {
      const payload = {
        type: "ACCIDENT",
        accidentId,
        ...(data || {}),
        ...(streetName ? { streetName } : {}),
      };

      const result = await provider.sendToUsers({ userIds, title, body, data: payload });

      // Best-effort logging
      try {
        await prisma.notificationLog.createMany({
          data: userIds.map((userId) => ({
            accidentId,
            userId,
            provider: "FCM",
            status: "SENT",
          })),
        });
      } catch {
        // ignore logging failures
      }

      return { ok: true, sent: result.sent, failed: result.failed };
    },
  };
}

