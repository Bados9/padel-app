import Link from "next/link";
import { ArrowRight, Clock, Home, Layers, Sun } from "lucide-react";
import { db } from "@/lib/db";
import { SURFACE_LABEL } from "@/lib/labels";
import { clubDayOfWeek, todayInClubTz } from "@/lib/time";

export const metadata = { title: "Rezervace kurtů · Padel klub" };

const DAY_NAMES = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

// Spojitý interval dnů se stejným startTime+endTime → "Po–Pá 8:00–22:00",
// nebo vrátí null, pokud se časy liší nebo je kurt zavřený většinu dnů.
function summarizeOpening(
  hours: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
): string | null {
  if (hours.length === 0) return null;
  const first = hours[0];
  const allSame = hours.every(
    (h) => h.startTime === first.startTime && h.endTime === first.endTime,
  );
  if (!allSame) return null;
  if (hours.length === 7) return `Po–Ne ${first.startTime}–${first.endTime}`;
  const days = hours.map((h) => DAY_NAMES[h.dayOfWeek]).join(" · ");
  return `${days} · ${first.startTime}–${first.endTime}`;
}

export default async function CourtsPage() {
  const courts = await db.court.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      openingHours: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { reservations: true } },
    },
  });

  const today = todayInClubTz();
  const dowToday = clubDayOfWeek(today);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-10">
      <header className="space-y-2">
        <div className="text-caption text-foreground-subtle">Krok 1 z 2</div>
        <h1 className="text-h1">Vyber si kurt</h1>
        <p className="text-foreground-muted max-w-xl">
          Na detailu kurtu uvidíš denní kalendář s volnými sloty a potvrdíš
          rezervaci.
        </p>
      </header>

      {courts.length === 0 ? (
        <p className="text-sm text-foreground-muted">Žádné aktivní kurty.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {courts.map((c) => {
            const summary = summarizeOpening(c.openingHours);
            const todaysOpening = c.openingHours.find(
              (o) => o.dayOfWeek === dowToday,
            );
            return (
              <Link
                key={c.id}
                href={`/rezervace/${c.id}`}
                className="group relative rounded-2xl border border-border bg-surface-raised p-5 space-y-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-h3 group-hover:text-primary transition-colors">
                      {c.name}
                    </h2>
                    {c.description ? (
                      <p className="mt-1 text-sm text-foreground-muted line-clamp-2">
                        {c.description}
                      </p>
                    ) : null}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
                    {c.indoor ? (
                      <>
                        <Home className="size-3" /> Krytý
                      </>
                    ) : (
                      <>
                        <Sun className="size-3" /> Venkovní
                      </>
                    )}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-medium text-foreground-muted">
                    <Layers className="size-3" />
                    {SURFACE_LABEL[c.surface]}
                  </span>
                  {todaysOpening ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-medium text-foreground-muted tnum">
                      <Clock className="size-3" />
                      dnes {todaysOpening.startTime}–{todaysOpening.endTime}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-medium text-foreground-muted">
                      <Clock className="size-3" />
                      dnes zavřeno
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-foreground-subtle">
                  <span className="truncate">{summary ?? "Otevřeno podle rozpisu"}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors shrink-0">
                    Dostupnost
                    <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
