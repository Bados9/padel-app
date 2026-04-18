"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionState } from "@/server/actions/reservation";

const updateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"]),
});

export async function updateUser(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { error: "Nemáš oprávnění." };
  }

  const parsed = updateSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    level: formData.get("level"),
  });
  if (!parsed.success) return { error: "Zkontroluj formulář." };

  // Prevence self-demote posledního admina
  if (parsed.data.userId === session.user.id && parsed.data.role !== "ADMIN") {
    const otherAdmins = await db.user.count({
      where: { role: "ADMIN", id: { not: session.user.id } },
    });
    if (otherAdmins === 0) {
      return { error: "Nemůžeš si ubrat admin roli – jsi jediný admin." };
    }
  }

  await db.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role, level: parsed.data.level },
  });

  revalidatePath("/admin/uzivatele");
  return {};
}
