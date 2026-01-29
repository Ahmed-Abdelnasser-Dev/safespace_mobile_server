import { z } from "zod";

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const mediaSchema = z
  .array(
    z.object({
      type: z.enum(["image", "video"]),
      url: z.string(),
    }),
  )
  .default([]);

export const reportAccidentSchema = z.object({
  location: locationSchema,
  message: z.string().max(2000).optional(),
  occurredAt: z.string().datetime(),
  media: mediaSchema.optional(),
});

export const emergencyRequestSchema = z
  .object({
    requestedAt: z.string().datetime(),
    location: locationSchema,
    message: z.string().max(2000).optional(),
    requestTypes: z
      .array(z.enum(["police", "firefight", "medical"]))
      .min(1)
      .max(3),
  })
  .strict();
