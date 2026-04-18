"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createReservation, type ActionState } from "@/server/actions/reservation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type FreeSlot = {
  startLabel: string;
  endLabel: string;
  minutes: number;
};

type Props = {
  courtId: string;
  date: string;
  freeSlots: FreeSlot[];
  isAuthed: boolean;
  loginHref: string;
};

const DURATIONS = [60, 90, 120];

export function ReservationForm({
  courtId,
  date,
  freeSlots,
  isAuthed,
  loginHref,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    ActionState | undefined,
    FormData
  >(createReservation, undefined);

  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(60);
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [neededPlayers, setNeededPlayers] = useState<number>(1);
  const [preferredLevel, setPreferredLevel] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  if (!isAuthed) {
    return (
      <Alert>
        <AlertTitle>Rezervace vyžaduje přihlášení</AlertTitle>
        <AlertDescription>
          <a href={loginHref} className="underline font-medium">
            Přihlas se
          </a>{" "}
          nebo se zaregistruj, ať si můžeš kurt zabukovat.
        </AlertDescription>
      </Alert>
    );
  }

  if (freeSlots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Pro tento den už nejsou volné sloty.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="courtId" value={courtId} />
      <input type="hidden" name="date" value={date} />

      <div className="space-y-2">
        <Label>Začátek</Label>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
          {freeSlots.map((s) => (
            <label
              key={s.startLabel}
              className={cn(
                "cursor-pointer rounded-md border px-2 py-1.5 text-center text-xs transition",
                selectedStart === s.startLabel
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20",
              )}
            >
              <input
                type="radio"
                name="startTime"
                value={s.startLabel}
                className="sr-only"
                checked={selectedStart === s.startLabel}
                onChange={() => setSelectedStart(s.startLabel)}
                required
              />
              {s.startLabel}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Délka</Label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <label
              key={d}
              className={cn(
                "cursor-pointer rounded-md border px-3 py-1.5 text-sm transition",
                duration === d
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="durationMinutes"
                value={d}
                className="sr-only"
                checked={duration === d}
                onChange={() => setDuration(d)}
              />
              {d} min
            </label>
          ))}
        </div>
      </div>

      <fieldset className="space-y-3 rounded-md border p-4">
        <legend className="px-1 text-sm font-medium">Typ hry</legend>
        <div className="flex gap-2">
          {[
            { v: "PRIVATE", label: "Soukromá" },
            { v: "PUBLIC", label: "Otevřená (matchmaking)" },
          ].map((o) => (
            <label
              key={o.v}
              className={cn(
                "cursor-pointer rounded-md border px-3 py-1.5 text-sm",
                visibility === o.v
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="visibility"
                value={o.v}
                className="sr-only"
                checked={visibility === o.v}
                onChange={() => setVisibility(o.v as "PRIVATE" | "PUBLIC")}
              />
              {o.label}
            </label>
          ))}
        </div>

        {visibility === "PUBLIC" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="neededPlayers">Kolik hráčů hledám</Label>
              <select
                id="neededPlayers"
                name="neededPlayers"
                value={neededPlayers}
                onChange={(e) => setNeededPlayers(Number(e.target.value))}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                {[1, 2, 3].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="preferredLevel">Preferovaná úroveň</Label>
              <select
                id="preferredLevel"
                name="preferredLevel"
                value={preferredLevel}
                onChange={(e) => setPreferredLevel(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">bez preference</option>
                <option value="BEGINNER">Začátečník</option>
                <option value="INTERMEDIATE">Mírně pokročilý</option>
                <option value="ADVANCED">Pokročilý</option>
                <option value="PRO">Závodní</option>
              </select>
            </div>
          </div>
        ) : null}
      </fieldset>

      <div className="space-y-1">
        <Label htmlFor="notes">Poznámka (volitelné)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Např. preferuji delší výměny, hrajeme s vlastními míči..."
        />
      </div>

      {state?.error ? (
        <Alert variant="destructive">
          <AlertTitle>Rezervaci se nepodařilo vytvořit</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || !selectedStart}>
          {pending ? "Rezervuji…" : "Rezervovat"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.refresh()}
          disabled={pending}
        >
          Obnovit dostupnost
        </Button>
      </div>
    </form>
  );
}
