import Link from "next/link";
import { ArrowRight, CalendarClock, Users, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import {
  clubLocalToUtc,
  formatTimeCZ,
  generateDaySlots,
  todayInClubTz,
  clubDayOfWeek,
} from "@/lib/time";
import { spotsLabel } from "@/lib/labels";

export default async function Home() {
  const session = await auth();
  const now = new Date();
  const today = todayInClubTz();
  const todayStart = clubLocalToUtc(today, "00:00");
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60_000);

  const [openGames, courtsWithOpening] = await Promise.all([
    db.reservation.findMany({
      where: {
        visibility: "PUBLIC",
        status: "CONFIRMED",
        startAt: { gt: now },
        neededPlayers: { gt: 0 },
      },
      orderBy: { startAt: "asc" },
      take: 3,
      include: {
        court: { select: { id: true, name: true } },
        _count: { select: { guests: true } },
      },
    }),
    db.court.findMany({
      where: { active: true },
      include: { openingHours: true },
    }),
  ]);

  // Najdi první volný slot dnes večer (po aktuálním čase)
  const todaysFreeSlots: Array<{
    courtName: string;
    courtId: string;
    time: string;
  }> = [];
  for (const court of courtsWithOpening) {
    const opening = court.openingHours.find(
      (o) => o.dayOfWeek === clubDayOfWeek(today),
    );
    if (!opening) continue;
    const slots = generateDaySlots(today, opening);
    const futureSlots = slots.filter((s) => s.endAt > now);
    if (futureSlots.length === 0) continue;
    // Bereme si jen start nejbližšího slotu, bez kontroly obsazenosti – indikativní
    todaysFreeSlots.push({
      courtName: court.name,
      courtId: court.id,
      time: formatTimeCZ(futureSlots[0].startAt),
    });
  }

  const reservationsTodayCount = await db.reservation.count({
    where: {
      status: "CONFIRMED",
      startAt: { gte: todayStart, lt: tomorrowStart },
    },
  });

  return (
    <div className="relative">
      {/* soft primary radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 size-[640px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/15 blur-3xl dark:bg-primary/10"
      />
      {/* court lines pattern – jen md+ */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-[520px] bg-[url('/patterns/court-lines.svg')] bg-[length:720px_360px] bg-center bg-no-repeat opacity-[0.05] md:block text-primary"
      />

      <section className="mx-auto max-w-5xl px-4 pt-16 pb-12 sm:pt-24 sm:pb-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface-raised px-3 py-1 text-caption text-foreground-muted shadow-xs">
          <span className="size-1.5 rounded-full bg-success animate-pulse" />
          Živá rezervace · {reservationsTodayCount} dnes
        </div>

        <h1 className="text-display">
          Padel.{" "}
          <span className="text-foreground-muted">Kdykoliv.</span>{" "}
          <span className="text-primary">S kýmkoliv.</span>
        </h1>

        <p className="mx-auto max-w-xl text-foreground-muted sm:text-base/relaxed">
          Vyber si kurt, zamluv si čas a přidej se k otevřeným hrám se spoluhráči
          na tvé úrovni.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/rezervace"
            className={buttonVariants({ size: "lg", className: "gap-2" })}
          >
            Rezervovat kurt
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/hry"
            className={buttonVariants({
              size: "lg",
              variant: "outline",
              className: "gap-2",
            })}
          >
            <Users className="size-4" />
            Otevřené hry
          </Link>
        </div>

        {!session ? (
          <p className="text-xs text-foreground-subtle pt-3">
            Testovací účet:{" "}
            <code className="px-1.5 py-0.5 rounded-md bg-surface-sunken text-foreground tnum">
              hrac@padel.local / hrac123
            </code>
          </p>
        ) : (
          <p className="text-xs text-foreground-subtle pt-3">
            Přihlášen jako <strong>{session.user?.name}</strong>
          </p>
        )}
      </section>

      {/* Live signály: nejbližší volné sloty + otevřené hry */}
      <section className="mx-auto max-w-5xl px-4 pb-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface-raised p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-caption text-foreground-subtle">
              <CalendarClock className="size-3.5" />
              Dnes volno
            </div>
            <Link
              href="/rezervace"
              className="text-xs text-primary hover:underline"
            >
              Všechny kurty →
            </Link>
          </div>
          {todaysFreeSlots.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              Dnes už jsou sloty pryč. Mrkni na{" "}
              <Link href="/rezervace" className="underline">
                zítřek
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-1.5">
              {todaysFreeSlots.map((s) => (
                <li key={s.courtId}>
                  <Link
                    href={`/rezervace/${s.courtId}?date=${today}`}
                    className="group flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:border-primary hover:bg-primary-soft hover:text-primary transition"
                  >
                    <span className="flex items-center gap-2">
                      <span className="tnum text-sm font-semibold">
                        {s.time}
                      </span>
                      <span className="text-sm text-foreground-muted group-hover:text-primary">
                        {s.courtName}
                      </span>
                    </span>
                    <ArrowRight className="size-3.5 text-foreground-subtle transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface-raised p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-caption text-foreground-subtle">
              <Users className="size-3.5" />
              Hledají spoluhráče
            </div>
            <Link
              href="/hry"
              className="text-xs text-primary hover:underline"
            >
              Všechny hry →
            </Link>
          </div>
          {openGames.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              Zatím žádná otevřená hra. Založ si{" "}
              <Link href="/rezervace" className="underline">
                vlastní
              </Link>{" "}
              a označ ji jako otevřenou.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {openGames.map((g) => {
                const free = Math.max(0, g.neededPlayers - g._count.guests);
                return (
                  <li key={g.id}>
                    <Link
                      href={`/hry/${g.id}`}
                      className="group flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:border-primary hover:bg-primary-soft hover:text-primary transition"
                    >
                      <span className="flex items-center gap-2">
                        <span className="tnum text-sm font-semibold">
                          {formatTimeCZ(g.startAt)}
                        </span>
                        <span className="text-sm text-foreground-muted group-hover:text-primary">
                          {g.court.name}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/40 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                        {spotsLabel(free)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Feature cards – asymetrické, ne CRUD status badges */}
      <section className="mx-auto max-w-5xl px-4 pb-20 grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon={<CalendarClock className="size-5" />}
          title="Rezervace za 30 sekund"
          desc="Vyber kurt, klikni na volný slot, potvrď. Bez telefonátů."
          span
        />
        <FeatureCard
          icon={<Users className="size-5" />}
          title="Najdi si partii"
          desc="Označ rezervaci jako otevřenou – doplníme ti hráče na tvé úrovni."
        />
        <FeatureCard
          icon={<Sparkles className="size-5" />}
          title="Žádné překvapení"
          desc="Dostupnost v reálném čase, přehled rezervací a jedno kliknutí pro zrušení."
        />
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  span,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  span?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface-raised p-6 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 ${span ? "md:col-span-1" : ""}`}
    >
      <div className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-h3">{title}</h3>
      <p className="mt-1.5 text-sm text-foreground-muted">{desc}</p>
    </div>
  );
}
