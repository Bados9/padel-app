import Link from "next/link";
import { ArrowRight, UsersRound } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatDateCZ, formatTimeCZ } from "@/lib/time";
import {
  LEVEL_LABEL,
  relativeTimeCs,
  spotsLabel,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

export const metadata = { title: "Otevřené hry · Hraj:Padel" };

const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PRO"] as const;

type PageProps = {
  searchParams: Promise<{ level?: string }>;
};

export default async function GamesListPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const levelFilter = LEVELS.find((l) => l === sp.level);

  const session = await auth();
  const now = new Date();

  const games = await db.reservation.findMany({
    where: {
      visibility: "PUBLIC",
      status: "CONFIRMED",
      startAt: { gt: now },
      neededPlayers: { gt: 0 },
      ...(levelFilter ? { preferredLevel: levelFilter } : {}),
    },
    orderBy: { startAt: "asc" },
    include: {
      court: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, level: true } },
      _count: { select: { guests: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="text-caption">06 — Matchmaking</div>
          <h1 className="text-h1">Otevřené hry</h1>
          <p className="text-foreground-muted max-w-xl">
            Přidej se k rezervaci jiného hráče – padel se hraje ve čtyřech.
          </p>
        </div>
        <Link
          href="/rezervace"
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm hover:-translate-y-0.5 transition"
        >
          <UsersRound className="size-4" />
          Založit vlastní hru
        </Link>
      </header>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-surface-sunken p-1 max-w-fit text-sm">
        <FilterPill href="/hry" active={!levelFilter}>
          Všechny úrovně
        </FilterPill>
        {LEVELS.map((l) => (
          <FilterPill
            key={l}
            href={`/hry?level=${l}`}
            active={levelFilter === l}
          >
            {LEVEL_LABEL[l]}
          </FilterPill>
        ))}
      </div>

      {games.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-surface-raised p-10 text-center space-y-3 shadow-soft">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-raised text-foreground-muted">
            <UsersRound className="size-6" />
          </div>
          <h2 className="text-h3">
            Zatím žádná otevřená hra
            {levelFilter ? ` pro úroveň ${LEVEL_LABEL[levelFilter]}` : ""}.
          </h2>
          <p className="text-sm text-foreground-muted">
            Založ vlastní rezervaci a označ ji jako{" "}
            <em>otevřenou</em>, ať se k tobě někdo přidá.
          </p>
          <Link
            href="/rezervace"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary-hover transition mt-2"
          >
            Rezervovat kurt
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {games.map((g) => {
            const totalPlayers = 1 + g._count.guests;
            const freeSpots = Math.max(0, g.neededPlayers - g._count.guests);
            const isFull = freeSpots === 0;
            const isOwner = session?.user?.id === g.owner.id;
            const rel = relativeTimeCs(g.startAt);
            return (
              <Link
                key={g.id}
                href={`/hry/${g.id}`}
                className="group grid gap-4 rounded-3xl bg-surface-raised p-5 shadow-soft ring-1 ring-border transition hover:shadow-md hover:-translate-y-0.5 hover:ring-primary/30 sm:grid-cols-[auto_1fr_auto] sm:items-center"
              >
                {/* Time column */}
                <div className="flex sm:flex-col sm:items-center sm:justify-center gap-2 sm:min-w-[120px] sm:rounded-2xl sm:bg-primary-soft sm:py-3 sm:px-4 sm:text-primary">
                  <div className="font-display text-3xl leading-none tnum">
                    {formatTimeCZ(g.startAt)}
                  </div>
                  <div className="text-xs text-foreground-subtle sm:text-center">
                    {formatDateCZ(g.startAt)}
                    {rel ? <div className="text-primary font-medium">{rel}</div> : null}
                  </div>
                </div>

                {/* Middle column */}
                <div className="space-y-1 sm:border-l sm:border-border sm:pl-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{g.court.name}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-0.5 text-[11px] font-medium text-foreground-muted tnum">
                      {totalPlayers}/4
                    </span>
                    {g.preferredLevel ? (
                      <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground-muted">
                        {LEVEL_LABEL[g.preferredLevel]}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-foreground-muted">
                    Organizuje {g.owner.name}
                    {g.owner.level ? ` · ${LEVEL_LABEL[g.owner.level]}` : ""}
                  </p>
                  {g.notes ? (
                    <p className="text-xs italic text-foreground-subtle line-clamp-1">
                      „{g.notes}“
                    </p>
                  ) : null}
                </div>

                {/* CTA column */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                      isFull
                        ? "bg-surface-sunken text-foreground-subtle"
                        : "bg-accent/40 text-accent-foreground",
                    )}
                  >
                    {isFull
                      ? "plné"
                      : freeSpots === 1
                        ? "poslední místo"
                        : spotsLabel(freeSpots)}
                  </span>
                  <div className="inline-flex items-center gap-1 text-sm text-foreground-muted group-hover:text-primary transition">
                    {isOwner ? "Detail" : "Přidat se"}
                    <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
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

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-1.5 font-medium transition",
        active
          ? "bg-surface-raised text-foreground shadow-sm"
          : "text-foreground-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
