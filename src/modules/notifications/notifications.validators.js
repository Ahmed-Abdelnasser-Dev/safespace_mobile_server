import { z } from "zod";

export const sendAccidentNotificationSchema = z
  .object({
    accidentId: z.string().uuid(),
    userIds: z.array(z.string().uuid()).min(1),
    title: z.string().min(1).max(200),
    body: z.string().min(1).max(1000),
    streetName: z.string().max(200).optional(),
    data: z.record(z.string(), z.any()).optional(),
  })
  .strict();

