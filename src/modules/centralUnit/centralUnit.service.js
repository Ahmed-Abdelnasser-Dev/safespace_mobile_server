import { createCentralUnitClient } from "./centralUnit.client.js";
import { isInRange } from "../accidents/accidents.service.js";

import { getEnv } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

export function createCentralUnitService({
  centralUnitRepo,
  accidentsRepo,
  notificationsService,
}) {
  const env = getEnv();
  const client = env.CENTRAL_UNIT_BASE_URL
    ? createCentralUnitClient({ baseUrl: env.CENTRAL_UNIT_BASE_URL })
    : null;

  return {
    async sendAccidentToCentralUnit({
      accidentId,
      description,
      latitude,
      longitude,
      severity,
      media,
    }) {
      if (!client) {
        logger.info(
          { accidentId },
          "Central Unit URL not configured, skipping send",
        );
        return { ok: false, reason: "not_configured" };
      }

      // Optionally validate the accident exists
      const existing = await centralUnitRepo.findAccidentById(accidentId);
      if (!existing) {
        const err = new Error("Accident not found");
        err.statusCode = 404;
        err.expose = true;
        err.code = "NOT_FOUND";
        throw err;
      }

      const resp = await client.sendAccident(
        {
          accidentId,
          description,
          latitude,
          longitude,
          severity,
          media,
        },
        { idempotencyKey: accidentId },
      );

      const ref =
        resp?.centralUnitReferenceId ||
        resp?.referenceId ||
        resp?.id ||
        "unknown";
      await centralUnitRepo.markAccidentSentToCentralUnit(
        accidentId,
        String(ref),
      );
      return { ok: true, centralUnitReferenceId: String(ref) };
    },

    async receiveAccidentFromCentralUnit({
      centralUnitAccidentId,
      occurredAt,
      location,
    }) {
      const created = await centralUnitRepo.createInboundCentralUnitAccident({
        centralUnitAccidentId,
        occurredAt: new Date(occurredAt),
        lat: location.lat,
        lng: location.lng,
      });

      // Get all users with active FCM tokens to notify them
      // In a future enhancement, we can filter by location (geo-fencing)
      let impactedUsers = [];
      try {
        impactedUsers = await centralUnitRepo.getActiveUsersWithFcmTokens();
        logger.info(
          { accidentId: created.id, userCount: impactedUsers.length },
          "Found active users to notify about accident"
        );
      } catch (err) {
        logger.warn(
          { err, accidentId: created.id },
          "Failed to fetch active users for notification"
        );
      }

      // Send notification to all active users about the accident
      if (notificationsService?.sendAccidentNotification && impactedUsers.length > 0) {
        try {
          await notificationsService.sendAccidentNotification({
            accidentId: created.id,
            userIds: impactedUsers,
            title: "Accident Nearby",
            body: "An accident has been reported in your area. Please stay alert.",
            streetName: null,
            data: {
              type: "ACCIDENT",
              accidentId: created.id,
              lat: String(location.lat),
              lng: String(location.lng),
              source: "CENTRAL_UNIT",
            },
          });
          logger.info(
            { accidentId: created.id, userCount: impactedUsers.length },
            "Accident notification sent to users"
          );
        } catch (err) {
          logger.error(
            { err, accidentId: created.id },
            "Failed to send accident notification"
          );
        }
      }

      return { ok: true };
    },
  };
}
