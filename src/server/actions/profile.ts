"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionState } from "@/server/actions/reservation";

const profileSchema = z.object({
  name: z.string().min(2).max(80),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"]),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6).max(100),
    confirmPassword: z.string().min(6),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Hesla se neshodují",
    path: ["confirmPassword"],
  });

export async function updateProfile(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nejsi přihlášen." };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    level: formData.get("level"),
  });
  if (!parsed.success) {
    return {
      error: "Zkontroluj formulář.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name, level: parsed.data.level },
  });

  revalidatePath("/profil");
  return {};
}

export async function changePassword(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Nejsi přihlášen." };

  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      error: "Zkontroluj formulář.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) return { error: "Uživatel nenalezen." };

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { error: "Aktuální heslo není správné." };

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  return {};
}
