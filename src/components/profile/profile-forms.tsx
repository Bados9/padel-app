"use client";

import { useActionState } from "react";
import { updateProfile, changePassword } from "@/server/actions/profile";
import type { ActionState } from "@/server/actions/reservation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const LEVELS = [
  { v: "BEGINNER", label: "Začátečník" },
  { v: "INTERMEDIATE", label: "Mírně pokročilý" },
  { v: "ADVANCED", label: "Pokročilý" },
  { v: "PRO", label: "Závodní" },
];

type Props = {
  defaultName: string;
  defaultLevel: string;
};

export function ProfileForm({ defaultName, defaultLevel }: Props) {
  const [state, formAction, pending] = useActionState<
    ActionState | undefined,
    FormData
  >(updateProfile, undefined);

  const ok = state && !state.error && !state.fieldErrors;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">Jméno</Label>
        <Input id="name" name="name" defaultValue={defaultName} required minLength={2} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="level">Herní úroveň</Label>
        <select
          id="level"
          name="level"
          defaultValue={defaultLevel}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        >
          {LEVELS.map((l) => (
            <option key={l.v} value={l.v}>
              {l.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Změna levelu se projeví po příštím přihlášení (JWT cookie).
        </p>
      </div>

      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {ok ? (
        <Alert>
          <AlertDescription>Profil uložen.</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Ukládám…" : "Uložit profil"}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<
    ActionState | undefined,
    FormData
  >(changePassword, undefined);

  const ok = state && !state.error && !state.fieldErrors;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="currentPassword">Aktuální heslo</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="newPassword">Nové heslo</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="confirmPassword">Potvrzení</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      {state?.error ? (
        <Alert variant="destructive">
          <AlertTitle>Heslo nebylo změněno</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {ok ? (
        <Alert>
          <AlertDescription>Heslo změněno.</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Měním…" : "Změnit heslo"}
      </Button>
    </form>
  );
}
