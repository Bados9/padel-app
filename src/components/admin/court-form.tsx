"use client";

import { useActionState } from "react";
import { createCourt, updateCourt } from "@/server/actions/admin/courts";
import type { ActionState } from "@/server/actions/reservation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DAYS = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];

const SURFACES = [
  { v: "ARTIFICIAL_GRASS", label: "Umělá tráva" },
  { v: "CARPET", label: "Koberec" },
  { v: "CONCRETE", label: "Beton" },
];

type OpeningDay = {
  dayOfWeek: number;
  closed: boolean;
  startTime: string;
  endTime: string;
};

type Props = {
  mode: "create" | "edit";
  court?: {
    id: string;
    name: string;
    description: string | null;
    surface: string;
    indoor: boolean;
    active: boolean;
  };
  openings?: OpeningDay[];
};

export function CourtForm({ mode, court, openings }: Props) {
  const action = mode === "create" ? createCourt : updateCourt;
  const [state, formAction, pending] = useActionState<
    ActionState | undefined,
    FormData
  >(action, undefined);

  const getOpening = (d: number): OpeningDay => {
    const row = openings?.find((o) => o.dayOfWeek === d);
    if (row) return row;
    return {
      dayOfWeek: d,
      closed: mode === "edit",
      startTime: "08:00",
      endTime: "22:00",
    };
  };

  return (
    <form action={formAction} className="space-y-6">
      {court?.id ? <input type="hidden" name="id" value={court.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Název kurtu</Label>
          <Input
            id="name"
            name="name"
            defaultValue={court?.name ?? ""}
            required
            minLength={2}
            maxLength={100}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="surface">Povrch</Label>
          <select
            id="surface"
            name="surface"
            defaultValue={court?.surface ?? "ARTIFICIAL_GRASS"}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            {SURFACES.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Popis (volitelné)</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={court?.description ?? ""}
          rows={2}
          maxLength={500}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="indoor"
            defaultChecked={court?.indoor ?? true}
          />
          Krytý
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={court?.active ?? true}
          />
          Aktivní
        </label>
      </div>

      <fieldset className="space-y-2 rounded-md border p-4">
        <legend className="px-1 text-sm font-medium">Otevírací doba</legend>
        <div className="space-y-1.5">
          {DAYS.map((name, d) => {
            const o = getOpening(d);
            return (
              <div key={d} className="grid grid-cols-[100px_80px_100px_100px] items-center gap-2 text-sm">
                <span className="text-muted-foreground">{name}</span>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    name={`oh_${d}_closed`}
                    defaultChecked={o.closed}
                  />
                  <span className="text-xs">zavřeno</span>
                </label>
                <input
                  type="time"
                  name={`oh_${d}_start`}
                  defaultValue={o.startTime}
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                />
                <input
                  type="time"
                  name={`oh_${d}_end`}
                  defaultValue={o.endTime}
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                />
              </div>
            );
          })}
        </div>
      </fieldset>

      {state?.error ? (
        <Alert variant="destructive">
          <AlertTitle>Uložení selhalo</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Ukládám…" : mode === "create" ? "Vytvořit kurt" : "Uložit změny"}
      </Button>
    </form>
  );
}
