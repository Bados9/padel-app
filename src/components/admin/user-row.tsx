"use client";

import { useActionState } from "react";
import type { PlayerLevel, UserRole } from "@prisma/client";
import { updateUser } from "@/server/actions/admin/users";
import type { ActionState } from "@/server/actions/reservation";
import { Button } from "@/components/ui/button";
import { LEVEL_LABEL, ROLE_LABEL } from "@/lib/labels";

const LEVELS: PlayerLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"];
const ROLES: UserRole[] = ["USER", "ADMIN"];

type Props = {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    level: PlayerLevel;
    createdAt: Date;
  };
  reservationsCount: number;
};

export function AdminUserRow({ user, reservationsCount }: Props) {
  const [state, formAction, pending] = useActionState<
    ActionState | undefined,
    FormData
  >(updateUser, undefined);

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 sm:grid-cols-[1fr_140px_180px_auto] items-center gap-2 rounded-md border bg-card px-3 py-2"
    >
      <input type="hidden" name="userId" value={user.id} />
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{user.name}</div>
        <div className="text-xs text-muted-foreground">
          {user.email} · {reservationsCount} rez.
        </div>
      </div>
      <select
        name="role"
        defaultValue={user.role}
        aria-label="Role uživatele"
        className="h-8 rounded-md border bg-background px-2 text-xs"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      <select
        name="level"
        defaultValue={user.level}
        aria-label="Herní úroveň"
        className="h-8 rounded-md border bg-background px-2 text-xs"
      >
        {LEVELS.map((l) => (
          <option key={l} value={l}>
            {LEVEL_LABEL[l]}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Ukládám…" : "Uložit"}
        </Button>
        {state?.error ? (
          <span className="text-xs text-destructive">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
