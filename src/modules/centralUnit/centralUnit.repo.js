import { AccidentSource } from "@prisma/client";

export function createCentralUnitRepo(prisma) {
  return {
    async findAccidentById(accidentId) {
      return prisma.accident.findUnique({
        where: { id: accidentId },
        include: { media: true },
      });
    },

    async markAccidentSentToCentralUnit(accidentId, centralUnitReferenceId) {
      return prisma.accident.update({
        where: { id: accidentId },
        data: {
          centralUnitReferenceId,
          status: "SENT_TO_CENTRAL_UNIT",
        },
        select: { id: true, centralUnitReferenceId: true },
      });
    },

    async createInboundCentralUnitAccident({ centralUnitAccidentId, occurredAt, lat, lng }) {
      return prisma.accident.create({
        data: {
          source: AccidentSource.CENTRAL_UNIT,
          centralUnitAccidentId,
          occurredAt,
          lat,
          lng,
          status: "RECEIVED_FROM_CENTRAL_UNIT",
        },
        select: { id: true },
      });
    },
  };
}

