import { AccidentSource } from "@prisma/client";
import { logger } from "../../utils/logger.js";

export function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * (sinDLng * sinDLng);

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isInRange(a, b, radiusMeters) {
  return haversineMeters(a, b) <= radiusMeters;
}

export function createAccidentsService({ accidentsRepo, centralUnitService }) {
  return {
    async reportAccident({ reporterUserId, location, message, occurredAt, media }) {
      const created = await accidentsRepo.createAccident({
        reporterUserId,
        source: AccidentSource.MOBILE,
        occurredAt: new Date(occurredAt),
        lat: location.lat,
        lng: location.lng,
        message: message || null,
        description: message || null,
        severity: "low",
        media: media || [],
        status: "RECEIVED",
      });

      // Best-effort: notify Central Unit right after persisting the accident.
      if (centralUnitService?.sendAccidentToCentralUnit) {
        centralUnitService
          .sendAccidentToCentralUnit({
            accidentId: created.id,
            description: message || "Accident reported from mobile app",
            latitude: location.lat,
            longitude: location.lng,
            severity: "low",
            media: media || [],
          })
          .catch((err) => {
            logger.warn(
              { err, accidentId: created.id },
              "failed to send accident to Central Unit (will not fail user request)"
            );
          });
      }

      return { accidentId: created.id, status: "received" };
    },

    async createEmergencyRequest({ requesterUserId, requestedAt, location, message, requestTypes }) {
      const created = await accidentsRepo.createEmergencyRequest({
        requesterUserId,
        requestedAt: new Date(requestedAt),
        lat: location.lat,
        lng: location.lng,
        message: message || null,
        requestTypes,
        status: "QUEUED",
      });

      return { requestId: created.id, status: "queued" };
    },
  };
}

