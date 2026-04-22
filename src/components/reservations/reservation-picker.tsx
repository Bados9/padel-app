"use client";

import { useMemo, useState, useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Loader2,
  Lock,
  UserCircle2,
  UsersRound,
} from "lucide-react";
import { createReservation, type ActionState } from "@/server/actions/reservation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { LEVEL_LABEL } from "@/lib/labels";

export type SlotState = "free" | "reserved" | "own" | "past" | "open";

export type PickerSlot = {
  startLabel: string; // "HH:mm" v klubové TZ
  endLabel: string;
  state: SlotState;
  // Pro "open" a "own" (v PUBLIC hře) odkaz na detail hry.
  linkHref?: string;
  // Pro "open" – kolik zbývá volných míst (pro tooltip / badge).
  freeSpots?: number;
};

type Props = {
  courtId: string;
  courtName: string;
  date: string; // "YYYY-MM-DD"
  dateLabel: string; // "pá 18. 4. 2026"
  dayName: string; // "Pá"
  slots: PickerSlot[]; // 30-min raster
  openingLabel: string | null; // "08:00–22:00" nebo null
  isOpen: boolean;
  isAuthed: boolean;
  loginHref: string;
  weekStrip: Array<{
    date: string;
    dayName: string;
    dayNum: string;
    isToday: boolean;
    isCurrent: boolean;
    isDisabled: boolean;
  }>;
  prevDateHref: string | null;
  nextDateHref: string | null;
  nextOpenDate: string | null; // pokud je zavřeno, kdy je dál otevřeno
  // Základ URL pro přepínání dne v week stripu. Default "/rezervace/<id>".
  baseDateHref?: string;
  // Kam redirectnout po úspěšné rezervaci (whitelist na serveru).
  returnTo?: string;
};

const SLOT_MINUTES = 30;
const DURATIONS = [60, 90, 120];

function parseTimeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minToLabel(min: number): string {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, "0");
  const mm = (min % 60).toString().padStart(2, "0");
  return `${h}:${mm}`;
}

export function ReservationPicker({
  courtId,
  courtName,
  date,
  dateLabel,
  dayName,
  slots,
  openingLabel,
  isOpen,
  isAuthed,
  loginHref,
  weekStrip,
  prevDateHref,
  nextDateHref,
  nextOpenDate,
  baseDateHref,
  returnTo,
}: Props) {
  const dateBase = baseDateHref ?? `/rezervace/${courtId}`;
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

  // Pro každý slot spočítej "max dostupných minut od tohoto startu"
  const slotRuns = useMemo(() => {
    const runs: Record<string, number> = {};
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].state !== "free") {
        runs[slots[i].startLabel] = 0;
        continue;
      }
      let count = 0;
      for (let j = i; j < slots.length && slots[j].state === "free"; j++) {
        count++;
      }
      runs[slots[i].startLabel] = count * SLOT_MINUTES;
    }
    return runs;
  }, [slots]);

  const maxDurationForSelected = selectedStart
    ? slotRuns[selectedStart] ?? 0
    : 0;

  // Zneplatnění délky, pokud je selected slot příliš krátký
  const effectiveDuration = useMemo(() => {
    if (!selectedStart) return duration;
    if (duration <= maxDurationForSelected) return duration;
    // vezmi největší přípustnou z DURATIONS
    const possible = DURATIONS.filter((d) => d <= maxDurationForSelected);
    return possible.length > 0 ? Math.max(...possible) : 0;
  }, [selectedStart, duration, maxDurationForSelected]);

  const selectedRange = useMemo(() => {
    if (!selectedStart || effectiveDuration <= 0) return null;
    const startMin = parseTimeToMin(selectedStart);
    const endMin = startMin + effectiveDuration;
    return { startMin, endMin };
  }, [selectedStart, effectiveDuration]);

  const canSubmit =
    isAuthed && selectedStart !== null && effectiveDuration >= 60 && !pending;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="courtId" value={courtId} />
      <input type="hidden" name="date" value={date} />
      {selectedStart ? (
        <input type="hidden" name="startTime" value={selectedStart} />
      ) : null}
      <input
        type="hidden"
        name="durationMinutes"
        value={effectiveDuration || duration}
      />
      <input type="hidden" name="visibility" value={visibility} />
      <input type="hidden" name="neededPlayers" value={neededPlayers} />
      <input type="hidden" name="preferredLevel" value={preferredLevel} />
      {returnTo ? (
        <input type="hidden" name="returnTo" value={returnTo} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* LEVÝ SLOUPEC – datum + slot grid */}
        <div className="space-y-5">
          {/* Week strip */}
          <div className="rounded-3xl bg-surface-raised p-4 shadow-soft ring-1 ring-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-caption text-foreground-subtle">Datum</div>
              <div className="flex items-center gap-1">
                {prevDateHref ? (
                  <Link
                    href={prevDateHref}
                    aria-label="Předchozí den"
                    className="grid size-7 place-items-center rounded-md hover:bg-surface-sunken text-foreground-muted hover:text-foreground transition"
                  >
                    <ChevronLeft className="size-4" />
                  </Link>
                ) : (
                  <span className="grid size-7 place-items-center rounded-md text-foreground-subtle opacity-40">
                    <ChevronLeft className="size-4" />
                  </span>
                )}
                {nextDateHref ? (
                  <Link
                    href={nextDateHref}
                    aria-label="Další den"
                    className="grid size-7 place-items-center rounded-md hover:bg-surface-sunken text-foreground-muted hover:text-foreground transition"
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                ) : (
                  <span className="grid size-7 place-items-center rounded-md text-foreground-subtle opacity-40">
                    <ChevronRight className="size-4" />
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {weekStrip.map((d) => {
                const content = (
                  <>
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wider",
                        d.isCurrent
                          ? "text-primary-foreground/80"
                          : "text-foreground-subtle",
                      )}
                    >
                      {d.dayName}
                    </span>
                    <span className="text-sm font-semibold tnum">{d.dayNum}</span>
                    {d.isToday && !d.isCurrent ? (
                      <span className="size-1 rounded-full bg-primary" />
                    ) : null}
                  </>
                );
                const baseClass = cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-center transition",
                  d.isCurrent
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "hover:bg-surface-sunken text-foreground",
                );
                if (d.isDisabled) {
                  return (
                    <span
                      key={d.date}
                      aria-disabled="true"
                      className={cn(baseClass, "opacity-30")}
                    >
                      {content}
                    </span>
                  );
                }
                return (
                  <Link
                    key={d.date}
                    href={`${dateBase}?date=${d.date}`}
                    className={baseClass}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Slot grid / zavřeno stav */}
          <div className="rounded-3xl bg-surface-raised p-6 shadow-soft ring-1 ring-border space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <div className="text-caption">
                  {dayName} · {dateLabel}
                </div>
                <h2 className="text-h2 mt-1">
                  {isOpen ? "Vyber si začátek" : "Kurt je zavřený"}
                </h2>
              </div>
              <div className="text-xs text-foreground-muted tnum">
                {isOpen && openingLabel ? `otevřeno ${openingLabel}` : null}
              </div>
            </div>

            {isOpen ? (
              <>
                <SlotGridInteractive
                  slots={slots}
                  selectedStart={selectedStart}
                  selectedRange={selectedRange}
                  onSelect={(label) => setSelectedStart(label)}
                />

                <LegendRow />
              </>
            ) : (
              <div className="rounded-xl bg-surface-sunken p-6 text-center space-y-2">
                <div className="mx-auto grid size-10 place-items-center rounded-xl bg-surface-raised text-foreground-muted">
                  <Lock className="size-5" />
                </div>
                <p className="text-sm text-foreground-muted">
                  Kurt má v tento den zavřeno.
                </p>
                {nextOpenDate ? (
                  <Link
                    href={`${dateBase}?date=${nextOpenDate}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    Nejbližší otevřený den →
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* PRAVÝ SLOUPEC – summary + detaily + submit */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-3xl bg-surface-raised p-6 shadow-soft ring-1 ring-border-strong space-y-4">
            <div className="flex items-center gap-2 text-caption text-foreground-subtle">
              <CalendarClock className="size-3.5" />
              Souhrn rezervace
            </div>

            {selectedStart && selectedRange ? (
              <div className="space-y-1.5">
                <div className="font-display text-[clamp(2rem,4vw,2.75rem)] leading-none tnum">
                  <span className="text-primary">{selectedStart}</span>
                  <span className="text-foreground-subtle mx-1">–</span>
                  <span>{minToLabel(selectedRange.endMin)}</span>
                </div>
                <div className="text-sm text-foreground-muted">
                  {dateLabel} · {courtName}
                </div>
                <div className="text-xs text-foreground-subtle">
                  {effectiveDuration} min · {visibility === "PRIVATE" ? "soukromá" : "otevřená hra"}
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground-muted">
                {isOpen
                  ? "Klikni na zelený slot v kalendáři."
                  : "V tento den není dostupnost."}
              </p>
            )}

            {selectedStart && duration > maxDurationForSelected && duration !== effectiveDuration ? (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft p-2.5 text-xs text-warning">
                <CircleAlert className="size-3.5 shrink-0 mt-0.5" />
                <span>
                  Do nejbližší obsazené rezervace je jen{" "}
                  {maxDurationForSelected} min, délka byla zkrácena.
                </span>
              </div>
            ) : null}

            {!isAuthed ? (
              <Link
                href={loginHref}
                className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary-hover transition"
              >
                Přihlásit se pro rezervaci
              </Link>
            ) : (
              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full h-11 font-semibold"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Rezervuji…
                  </>
                ) : (
                  "Rezervovat"
                )}
              </Button>
            )}
          </div>

          {/* Détail: délka + typ hry + notes – jen když už je vybrán slot */}
          <fieldset
            disabled={!selectedStart}
            className={cn(
              "space-y-5 rounded-3xl bg-surface-raised p-6 shadow-soft ring-1 ring-border transition",
              !selectedStart && "opacity-60",
            )}
          >
            <div className="space-y-2">
              <Label className="text-caption text-foreground-subtle">
                Délka
              </Label>
              <div className="inline-flex rounded-lg bg-surface-sunken p-1 w-full">
                {DURATIONS.map((d) => {
                  const disabled = selectedStart !== null && d > maxDurationForSelected;
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={disabled}
                      onClick={() => setDuration(d)}
                      className={cn(
                        "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition",
                        effectiveDuration === d
                          ? "bg-surface-raised text-foreground shadow-sm"
                          : "text-foreground-muted hover:text-foreground",
                        disabled && "opacity-40 cursor-not-allowed",
                      )}
                    >
                      {d} min
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-caption text-foreground-subtle">
                Typ hry
              </Label>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-sunken p-1">
                <button
                  type="button"
                  onClick={() => setVisibility("PRIVATE")}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                    visibility === "PRIVATE"
                      ? "bg-surface-raised text-foreground shadow-sm"
                      : "text-foreground-muted hover:text-foreground",
                  )}
                >
                  <UserCircle2 className="size-3.5" />
                  Soukromá
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("PUBLIC")}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                    visibility === "PUBLIC"
                      ? "bg-surface-raised text-foreground shadow-sm"
                      : "text-foreground-muted hover:text-foreground",
                  )}
                >
                  <UsersRound className="size-3.5" />
                  Otevřená
                </button>
              </div>
              <p className="text-xs text-foreground-subtle">
                {visibility === "PUBLIC"
                  ? "Do hry se mohou přidat další hráči podle úrovně."
                  : "Termín si blokuješ jen pro sebe a své pozvané."}
              </p>
            </div>

            {visibility === "PUBLIC" ? (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
                <div className="space-y-1">
                  <Label htmlFor="np" className="text-caption text-foreground-subtle">
                    Hledám spoluhráče
                  </Label>
                  <select
                    id="np"
                    value={neededPlayers}
                    onChange={(e) => setNeededPlayers(Number(e.target.value))}
                    className="h-9 w-full rounded-md border border-input bg-surface-raised px-2.5 text-sm"
                  >
                    <option value={1}>1 volné místo</option>
                    <option value={2}>2 volná místa</option>
                    <option value={3}>3 volná místa</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pl" className="text-caption text-foreground-subtle">
                    Úroveň
                  </Label>
                  <select
                    id="pl"
                    value={preferredLevel}
                    onChange={(e) => setPreferredLevel(e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-surface-raised px-2.5 text-sm"
                  >
                    <option value="">bez preference</option>
                    {Object.entries(LEVEL_LABEL).map(([v, label]) => (
                      <option key={v} value={v}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            <div className="space-y-1">
              <Label htmlFor="notes" className="text-caption text-foreground-subtle">
                Poznámka (volitelné)
              </Label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-input bg-surface-raised px-3 py-2 text-sm"
                placeholder="Např. hrajeme s vlastními míči…"
              />
            </div>
          </fieldset>

          {state?.error ? (
            <Alert variant="destructive">
              <AlertTitle>Rezervaci se nepodařilo vytvořit</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <button
            type="button"
            onClick={() => router.refresh()}
            className="w-full text-xs text-foreground-subtle hover:text-foreground transition"
          >
            Obnovit dostupnost
          </button>
        </aside>
      </div>

      {/* Mobile sticky bottom CTA – viditelné pod lg */}
      {isAuthed ? (
        <div className="sticky bottom-0 z-30 -mx-4 border-t border-border bg-surface-raised/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {selectedStart && selectedRange ? (
                <>
                  <div className="truncate tnum text-sm font-semibold">
                    {selectedStart}–{minToLabel(selectedRange.endMin)}
                  </div>
                  <div className="truncate text-[11px] text-foreground-subtle">
                    {effectiveDuration} min · {visibility === "PRIVATE" ? "soukromá" : "otevřená"}
                  </div>
                </>
              ) : (
                <div className="text-xs text-foreground-muted">
                  Vyber čas v kalendáři výš
                </div>
              )}
            </div>
            <Button type="submit" disabled={!canSubmit} className="shrink-0">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Rezervuji
                </>
              ) : (
                "Rezervovat"
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function SlotGridInteractive({
  slots,
  selectedStart,
  selectedRange,
  onSelect,
}: {
  slots: PickerSlot[];
  selectedStart: string | null;
  selectedRange: { startMin: number; endMin: number } | null;
  onSelect: (label: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {slots.map((s) => {
        const slotMin = parseTimeToMin(s.startLabel);
        const inRange =
          selectedRange !== null &&
          slotMin >= selectedRange.startMin &&
          slotMin < selectedRange.endMin;
        const isSelectedStart = selectedStart === s.startLabel;

        const stateLabel =
          s.state === "free"
            ? "volno"
            : s.state === "reserved"
              ? "obsazeno"
              : s.state === "own"
                ? "vaše"
                : s.state === "open"
                  ? s.freeSpots === 1
                    ? "1 místo"
                    : `${s.freeSpots ?? 0} míst`
                  : "uplynulo";

        const baseClass = cn(
          "relative flex min-h-[60px] flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition",
          s.state === "free" &&
            "border-border bg-surface-raised hover:border-primary hover:bg-primary-soft cursor-pointer",
          s.state === "reserved" &&
            "border-border bg-surface-sunken bg-stripes text-foreground-subtle cursor-not-allowed",
          s.state === "own" &&
            cn(
              "border-info/40 bg-info-soft text-info",
              s.linkHref ? "hover:border-info cursor-pointer" : "cursor-not-allowed",
            ),
          s.state === "open" &&
            "border-accent bg-accent/40 text-accent-foreground hover:border-accent-foreground/40 hover:brightness-105 cursor-pointer",
          s.state === "past" &&
            "border-dashed border-border opacity-50 text-foreground-subtle cursor-not-allowed",
          inRange &&
            "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30",
          isSelectedStart &&
            "ring-2 ring-primary ring-offset-1 ring-offset-background z-10",
        );

        const content = (
          <>
            <span className="tnum text-[13px] font-semibold leading-none">
              {s.startLabel}
            </span>
            <span
              className={cn(
                "text-[10px] uppercase tracking-wider",
                inRange
                  ? "text-primary-foreground/80"
                  : s.state === "own"
                    ? "text-info"
                    : s.state === "open"
                      ? "text-accent-foreground"
                      : "text-foreground-subtle",
              )}
            >
              {inRange
                ? isSelectedStart
                  ? "start"
                  : "zabráno"
                : stateLabel}
            </span>
            {s.state === "open" && !inRange ? (
              <span
                aria-hidden
                className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent-foreground/70 animate-pulse"
              />
            ) : null}
          </>
        );

        // "open" a "own"+linkHref vedou na detail hry
        if ((s.state === "open" || s.state === "own") && s.linkHref && !inRange) {
          return (
            <Link
              key={s.startLabel}
              href={s.linkHref}
              data-state={s.state}
              className={baseClass}
              title={
                s.state === "open"
                  ? "Otevřená hra – klikni pro detail a přidání"
                  : "Tvoje hra – klikni pro detail"
              }
            >
              {content}
            </Link>
          );
        }

        const disabled = s.state !== "free";
        return (
          <button
            key={s.startLabel}
            type="button"
            onClick={() => onSelect(s.startLabel)}
            disabled={disabled}
            data-state={s.state}
            className={baseClass}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

function LegendRow() {
  const items: Array<{ state: SlotState; label: string; cls: string }> = [
    { state: "free", label: "Volné", cls: "bg-surface-raised border-border" },
    {
      state: "open",
      label: "Otevřená hra – přidej se",
      cls: "bg-accent/40 border-accent",
    },
    {
      state: "reserved",
      label: "Plně obsazené",
      cls: "bg-surface-sunken bg-stripes border-border",
    },
    {
      state: "own",
      label: "Vaše",
      cls: "bg-info-soft border-info/40",
    },
    {
      state: "past",
      label: "Uplynulé",
      cls: "border-dashed opacity-50",
    },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border text-xs">
      {items.map((i) => (
        <div key={i.state} className="flex items-center gap-1.5">
          <span className={cn("inline-block size-3 rounded border", i.cls)} />
          <span className="text-foreground-muted">{i.label}</span>
        </div>
      ))}
    </div>
  );
}
