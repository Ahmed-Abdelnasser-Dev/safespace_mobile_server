import { z } from "zod";

export const sendAccidentSchema = z
  .object({
    accidentId: z.string().uuid(),
    description: z.string().min(1).max(5000),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    severity: z.enum(["low", "medium", "high"]),
    media: z
      .array(
        z.object({
          type: z.enum(["image", "video"]),
          url: z.string().url(),
        })
      )
      .default([]),
  })
  .strict();

export const receiveAccidentSchema = z
  .object({
    centralUnitAccidentId: z.string().min(1),
    occurredAt: z.string().datetime(),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  })
  .strict();

