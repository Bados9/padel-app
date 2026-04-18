import { z } from "zod";
import {
  MIN_RESERVATION_MINUTES,
  MAX_RESERVATION_MINUTES,
  SLOT_MINUTES,
} from "@/lib/club";

export const createReservationSchema = z
  .object({
    courtId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Neplatné datum"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Neplatný čas"),
    durationMinutes: z.coerce
      .number()
      .int()
      .min(MIN_RESERVATION_MINUTES, `Minimálně ${MIN_RESERVATION_MINUTES} min`)
      .max(MAX_RESERVATION_MINUTES, `Maximálně ${MAX_RESERVATION_MINUTES} min`)
      .refine((v) => v % SLOT_MINUTES === 0, {
        message: `Délka musí být násobek ${SLOT_MINUTES} min`,
      }),
    visibility: z.enum(["PRIVATE", "PUBLIC"]).default("PRIVATE"),
    neededPlayers: z.coerce.number().int().min(0).max(3).default(0),
    preferredLevel: z
      .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"])
      .optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (v) => (v.visibility === "PUBLIC" ? v.neededPlayers >= 1 : true),
    { message: "Veřejná hra potřebuje alespoň 1 volné místo", path: ["neededPlayers"] },
  );

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export const cancelReservationSchema = z.object({
  reservationId: z.string().min(1),
});
