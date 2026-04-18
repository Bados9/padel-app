"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionState } from "@/server/actions/reservation";

const TIME_RE = /^\d{2}:\d{2}$/;

const surfaceSchema = z.enum(["ARTIFICIAL_GRASS", "CARPET", "CONCRETE"]);

const courtBaseSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  surface: surfaceSchema,
  indoor: z.coerce.boolean(),
  active: z.coerce.boolean(),
});

const openingDaySchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  closed: z.coerce.boolean(),
  startTime: z.string().regex(TIME_RE),
  endTime: z.string().regex(TIME_RE),
});

async function assertAdmin(): Promise<string | { error: string }> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Nemáš oprávnění." };
  }
  return session.user.id;
}

function parseOpeningHours(formData: FormData) {
  const rows: z.infer<typeof openingDaySchema>[] = [];
  for (let d = 0; d < 7; d++) {
    const row = openingDaySchema.safeParse({
      dayOfWeek: d,
      closed: formData.get(`oh_${d}_closed`) === "on",
      startTime: formData.get(`oh_${d}_start`) || "08:00",
      endTime: formData.get(`oh_${d}_end`) || "22:00",
    });
    if (!row.success) return null;
    if (!row.data.closed) {
      const [sh, sm] = row.data.startTime.split(":").map(Number);
      const [eh, em] = row.data.endTime.split(":").map(Number);
      if (eh * 60 + em <= sh * 60 + sm) return null;
    }
    rows.push(row.data);
  }
  return rows;
}

export async function createCourt(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const admin = await assertAdmin();
  if (typeof admin !== "string") return admin;

  const parsed = courtBaseSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    surface: formData.get("surface"),
    indoor: formData.get("indoor") === "on",
    active: formData.get("active") !== "off",
  });
  if (!parsed.success) {
    return {
      error: "Zkontroluj formulář.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const openings = parseOpeningHours(formData);
  if (!openings) return { error: "Chybná otevírací doba (konec musí být za začátkem)." };

  try {
    const court = await db.court.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        surface: parsed.data.surface,
        indoor: parsed.data.indoor,
        active: parsed.data.active,
        openingHours: {
          create: openings
            .filter((o) => !o.closed)
            .map((o) => ({
              dayOfWeek: o.dayOfWeek,
              startTime: o.startTime,
              endTime: o.endTime,
            })),
        },
      },
    });
    revalidatePath("/admin/kurty");
    revalidatePath("/rezervace");
    redirect(`/admin/kurty/${court.id}`);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Kurt s tímto jménem už existuje." };
    }
    throw err;
  }
}

export async function updateCourt(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const admin = await assertAdmin();
  if (typeof admin !== "string") return admin;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Chybné ID." };

  const parsed = courtBaseSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    surface: formData.get("surface"),
    indoor: formData.get("indoor") === "on",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    return {
      error: "Zkontroluj formulář.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const openings = parseOpeningHours(formData);
  if (!openings) return { error: "Chybná otevírací doba." };

  try {
    await db.$transaction(async (tx) => {
      await tx.court.update({
        where: { id },
        data: {
          name: parsed.data.name,
          description: parsed.data.description || null,
          surface: parsed.data.surface,
          indoor: parsed.data.indoor,
          active: parsed.data.active,
        },
      });
      await tx.openingHours.deleteMany({ where: { courtId: id } });
      await tx.openingHours.createMany({
        data: openings
          .filter((o) => !o.closed)
          .map((o) => ({
            courtId: id,
            dayOfWeek: o.dayOfWeek,
            startTime: o.startTime,
            endTime: o.endTime,
          })),
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Kurt s tímto jménem už existuje." };
    }
    throw err;
  }

  revalidatePath("/admin/kurty");
  revalidatePath(`/admin/kurty/${id}`);
  revalidatePath("/rezervace");
  revalidatePath(`/rezervace/${id}`);
  return {};
}

export async function toggleCourtActive(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const admin = await assertAdmin();
  if (typeof admin !== "string") return admin;

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Chybné ID." };

  const court = await db.court.findUnique({ where: { id }, select: { active: true } });
  if (!court) return { error: "Kurt neexistuje." };

  await db.court.update({
    where: { id },
    data: { active: !court.active },
  });

  revalidatePath("/admin/kurty");
  revalidatePath("/rezervace");
  return {};
}
