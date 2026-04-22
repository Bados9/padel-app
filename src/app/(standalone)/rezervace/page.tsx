import Link from "next/link";
import { ArrowRight, Clock, Home, Layers, Sun } from "lucide-react";
import { db } from "@/lib/db";
import { SURFACE_LABEL } from "@/lib/labels";
import { clubDayOfWeek, todayInClubTz } from "@/lib/time";

export const metadata = { title: "Rezervace kurtů · Hraj:Padel" };

const DAY_NAMES = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 space-y-10">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="text-caption">05 — Rezervace · Krok 1 z 2</div>
          <h1 className="text-h1">Vyber si kurt</h1>
          <p className="text-foreground-muted max-w-xl">
            Na detailu kurtu uvidíš denní kalendář s volnými sloty a potvrdíš
            rezervaci.
          </p>
        </div>
        <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-foreground-subtle">
          {courts.length} {courts.length === 1 ? "kurt" : courts.length < 5 ? "kurty" : "kurtů"}
        </div>
      </header>

      {courts.length === 0 ? (
        <p className="text-sm text-foreground-muted">Žádné aktivní kurty.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courts.map((c) => {
            const summary = summarizeOpening(c.openingHours);
            const todaysOpening = c.openingHours.find(
              (o) => o.dayOfWeek === dowToday,
            );
            return (
              <Link
                key={c.id}
                href={`/rezervace/${c.id}`}
                className="group relative rounded-3xl bg-surface-raised shadow-soft ring-1 ring-border overflow-hidden transition hover:-translate-y-0.5"
              >
                {/* hero band – court graphic */}
                <div
                  className="relative h-32 overflow-hidden"
                  style={{ background: c.indoor ? "#1E40AF" : "#6BB6FF" }}
                >
                  <svg
                    viewBox="0 0 320 120"
                    preserveAspectRatio="none"
                    aria-hidden
                    className="absolute inset-0 h-full w-full opacity-80"
                  >
                    <rect x="20" y="16" width="280" height="88" fill="none" stroke="#fff" strokeWidth="2" />
                    <line x1="160" y1="16" x2="160" y2="104" stroke="#fff" strokeWidth="2" />
                    <line x1="20" y1="60" x2="300" y2="60" stroke="#fff" strokeWidth="1.6" />
                  </svg>
                  {/* ball */}
                  <div className="absolute -bottom-4 -right-4">
                    <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
                      <circle cx="36" cy="36" r="32" fill="#D4ED4C" />
                      <path
                        d="M8 28 C18 50, 54 22, 64 44"
                        stroke="#fff"
                        strokeWidth="1.8"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.08em] text-foreground">
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

                <div className="p-5 space-y-3">
                  <div>
                    <h2 className="font-display text-2xl group-hover:text-primary transition-colors">
                      {c.name}
                    </h2>
                    {c.description ? (
                      <p className="mt-1 text-sm text-foreground-muted line-clamp-2">
                        {c.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="pill inline-flex items-center gap-1.5 bg-surface-sunken px-2.5 py-1 text-xs font-medium text-foreground-muted">
                      <Layers className="size-3" />
                      {SURFACE_LABEL[c.surface]}
                    </span>
                    {todaysOpening ? (
                      <span className="pill inline-flex items-center gap-1.5 bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary tnum">
                        <Clock className="size-3" />
                        dnes {todaysOpening.startTime}–{todaysOpening.endTime}
                      </span>
                    ) : (
                      <span className="pill inline-flex items-center gap-1.5 bg-surface-sunken px-2.5 py-1 text-xs font-medium text-foreground-subtle">
                        <Clock className="size-3" />
                        dnes zavřeno
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-foreground-subtle">
                    <span className="truncate">{summary ?? "Otevřeno podle rozpisu"}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary shrink-0">
                      Dostupnost
                      <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
