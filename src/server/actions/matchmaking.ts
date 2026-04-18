"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionState } from "@/server/actions/reservation";

const idSchema = z.object({ reservationId: z.string().min(1) });

export async function joinGame(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nejsi přihlášen." };

  const parsed = idSchema.safeParse({
    reservationId: formData.get("reservationId"),
  });
  if (!parsed.success) return { error: "Chybné ID hry." };

  const reservation = await db.reservation.findUnique({
    where: { id: parsed.data.reservationId },
    include: {
      _count: { select: { guests: true } },
    },
  });
  if (!reservation) return { error: "Hra neexistuje." };
  if (reservation.visibility !== "PUBLIC") {
    return { error: "Toto není otevřená hra." };
  }
  if (reservation.status !== "CONFIRMED") {
    return { error: "Hra byla zrušena." };
  }
  if (reservation.startAt.getTime() <= Date.now()) {
    return { error: "Hra už začala nebo proběhla." };
  }
  if (reservation.ownerId === session.user.id) {
    return { error: "Jsi organizátor, přidávat se nemusíš." };
  }
  if (reservation._count.guests >= reservation.neededPlayers) {
    return { error: "Hra je plná." };
  }

  try {
    await db.reservationGuest.create({
      data: {
        reservationId: reservation.id,
        userId: session.user.id,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Už ses přihlásil." };
    }
    throw err;
  }

  revalidatePath(`/hry`);
  revalidatePath(`/hry/${reservation.id}`);
  revalidatePath(`/moje-rezervace`);
  return {};
}

export async function leaveGame(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nejsi přihlášen." };

  const parsed = idSchema.safeParse({
    reservationId: formData.get("reservationId"),
  });
  if (!parsed.success) return { error: "Chybné ID hry." };

  const reservation = await db.reservation.findUnique({
    where: { id: parsed.data.reservationId },
    select: { id: true, startAt: true, status: true },
  });
  if (!reservation) return { error: "Hra neexistuje." };
  if (reservation.startAt.getTime() <= Date.now()) {
    return { error: "Hra už začala, nelze se odhlásit." };
  }

  const guest = await db.reservationGuest.findUnique({
    where: {
      reservationId_userId: {
        reservationId: reservation.id,
        userId: session.user.id,
      },
    },
    select: { id: true },
  });
  if (!guest) return { error: "V této hře nehraješ." };

  await db.reservationGuest.delete({ where: { id: guest.id } });

  revalidatePath(`/hry`);
  revalidatePath(`/hry/${reservation.id}`);
  revalidatePath(`/moje-rezervace`);
  return {};
}
