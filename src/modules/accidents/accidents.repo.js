export function createAccidentsRepo(prisma) {
  return {
    async createAccident(data) {
      return prisma.accident.create({
        data: {
          reporterUserId: data.reporterUserId,
          source: data.source,
          occurredAt: data.occurredAt,
          lat: data.lat,
          lng: data.lng,
          message: data.message,
          description: data.description,
          severity: data.severity,
          status: data.status || "RECEIVED",
          media: data.media?.length
            ? {
                create: data.media.map((m) => ({ type: m.type, url: m.url })),
              }
            : undefined,
        },
        select: { id: true },
      });
    },

    async createEmergencyRequest(data) {
      return prisma.emergencyRequest.create({
        data: {
          requesterUserId: data.requesterUserId,
          requestedAt: data.requestedAt,
          lat: data.lat,
          lng: data.lng,
          message: data.message,
          requestTypes: data.requestTypes,
          status: data.status || "QUEUED",
        },
        select: { id: true },
      });
    },
  };
}

