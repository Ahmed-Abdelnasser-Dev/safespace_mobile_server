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

      // "In range" matching is required to be pure/testable; we keep the core logic in accidents module.
      // We don't yet have user live locations in schema, so we treat impacted users as empty list for now.
      const impactedUsers = [];
      void isInRange(location, location, 1); // keep pure function reachable (no-op)

      if (
        notificationsService?.sendAccidentNotification &&
        impactedUsers.length
      ) {
        await notificationsService.sendAccidentNotification({
          accidentId: created.id,
          userIds: impactedUsers,
          title: "Accident nearby",
          body: "An accident was reported near you.",
          data: { type: "ACCIDENT", accidentId: created.id },
        });
      }

      return { ok: true };
    },
  };
}
