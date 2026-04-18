"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createReservationSchema,
  cancelReservationSchema,
} from "@/lib/validators/reservation";
import {
  addMinutes,
  clubDayOfWeek,
  clubLocalToUtc,
} from "@/lib/time";
import { MAX_DAYS_AHEAD } from "@/lib/club";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export async function createReservation(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Nejsi přihlášen." };
  }

  const raw = {
    courtId: formData.get("courtId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    durationMinutes: formData.get("durationMinutes"),
    visibility: formData.get("visibility") ?? "PRIVATE",
    neededPlayers: formData.get("neededPlayers") ?? 0,
    preferredLevel: formData.get("preferredLevel") || undefined,
    notes: formData.get("notes") || undefined,
  };

  const parsed = createReservationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Zkontroluj formulář.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const input = parsed.data;

  const court = await db.court.findUnique({
    where: { id: input.courtId },
    include: { openingHours: true },
  });
  if (!court || !court.active) {
    return { error: "Kurt neexistuje nebo je neaktivní." };
  }

  const startAt = clubLocalToUtc(input.date, input.startTime);
  const endAt = addMinutes(startAt, input.durationMinutes);
  const now = new Date();

  if (startAt.getTime() <= now.getTime()) {
    return { error: "Nelze rezervovat v minulosti." };
  }

  const maxAhead = new Date(now.getTime() + MAX_DAYS_AHEAD * 24 * 60 * 60_000);
  if (startAt.getTime() > maxAhead.getTime()) {
    return { error: `Rezervovat lze nejdéle ${MAX_DAYS_AHEAD} dní dopředu.` };
  }

  const dayOfWeek = clubDayOfWeek(input.date);
  const oh = court.openingHours.find((o) => o.dayOfWeek === dayOfWeek);
  if (!oh) {
    return { error: "Kurt je ten den zavřený." };
  }

  const startMin = parseTimeToMinutes(input.startTime);
  const endMin = startMin + input.durationMinutes;
  const openStart = parseTimeToMinutes(oh.startTime);
  const openEnd = parseTimeToMinutes(oh.endTime);
  if (startMin < openStart || endMin > openEnd) {
    return { error: `Mimo otevírací dobu (${oh.startTime}–${oh.endTime}).` };
  }

  // Kolize – hledáme existující rezervaci, která se překrývá
  const conflict = await db.reservation.findFirst({
    where: {
      courtId: input.courtId,
      status: "CONFIRMED",
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true },
  });
  if (conflict) {
    return { error: "Termín už je obsazený, vyber jiný slot." };
  }

  try {
    await db.reservation.create({
      data: {
        courtId: input.courtId,
        ownerId: session.user.id,
        startAt,
        endAt,
        status: "CONFIRMED",
        visibility: input.visibility,
        neededPlayers: input.visibility === "PUBLIC" ? input.neededPlayers : 0,
        preferredLevel:
          input.visibility === "PUBLIC" ? (input.preferredLevel ?? null) : null,
        notes: input.notes ?? null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: `DB chyba: ${err.code}` };
    }
    throw err;
  }

  revalidatePath(`/rezervace/${input.courtId}`);
  revalidatePath(`/rezervace`);
  revalidatePath(`/moje-rezervace`);
  redirect(`/moje-rezervace?created=1`);
}

export async function cancelReservation(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nejsi přihlášen." };

  const parsed = cancelReservationSchema.safeParse({
    reservationId: formData.get("reservationId"),
  });
  if (!parsed.success) return { error: "Chybné ID rezervace." };

  const reservation = await db.reservation.findUnique({
    where: { id: parsed.data.reservationId },
    select: { id: true, ownerId: true, startAt: true, status: true, courtId: true },
  });
  if (!reservation) return { error: "Rezervace neexistuje." };

  const isOwner = reservation.ownerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) return { error: "Nemáš oprávnění." };

  if (reservation.status === "CANCELLED") {
    return { error: "Rezervace už je zrušená." };
  }

  if (reservation.startAt.getTime() <= Date.now() && !isAdmin) {
    return { error: "Už nelze rušit – začala, nebo proběhla." };
  }

  await db.reservation.update({
    where: { id: reservation.id },
    data: { status: "CANCELLED" },
  });

  revalidatePath(`/rezervace/${reservation.courtId}`);
  revalidatePath(`/moje-rezervace`);
  return {};
}
