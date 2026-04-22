import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarClock, Users, Zap } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  clubLocalToUtc,
  formatTimeCZ,
  generateDaySlots,
  todayInClubTz,
  clubDayOfWeek,
} from "@/lib/time";
import { spotsLabel } from "@/lib/labels";
import { Wordmark } from "@/components/layout/logo";

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

  const dateLabel = new Date().toLocaleDateString("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 space-y-10">
      {/* HERO */}
      <section className="grid gap-6 md:grid-cols-12">
        {/* Big brand hero card */}
        <div className="relative md:col-span-8 rounded-3xl overflow-hidden shadow-soft text-white min-h-[420px] court-grad">
          {/* court lines */}
          <svg
            viewBox="0 0 700 420"
            preserveAspectRatio="none"
            aria-hidden
            className="absolute inset-0 h-full w-full opacity-70"
          >
            <rect x="40" y="40" width="620" height="340" fill="none" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="350" y1="40" x2="350" y2="380" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="40" y1="210" x2="660" y2="210" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="140" y1="40" x2="140" y2="380" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="560" y1="40" x2="560" y2="380" stroke="#FFFFFF" strokeWidth="2" />
          </svg>

          <div className="relative flex h-full flex-col justify-between p-8 sm:p-10">
            <div className="flex items-center justify-between text-white/85 text-[11px] font-mono uppercase tracking-[0.08em]">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-1.5 rounded-full bg-accent animate-pulse" />
                Živá rezervace · {reservationsTodayCount} dnes
              </span>
              <span>{dateLabel}</span>
            </div>

            <div className="mt-10">
              <h1 className="font-display text-white text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.88]">
                Padel.<br />
                <span className="text-white/80">Kdykoliv.</span>{" "}
                <span style={{ color: "#D4ED4C" }}>S kýmkoliv.</span>
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/rezervace"
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-primary shadow-sm transition hover:-translate-y-0.5"
                >
                  <CalendarClock className="size-4" />
                  Rezervovat kurt
                  <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link
                  href="/hry"
                  className="group inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition hover:-translate-y-0.5"
                >
                  <Zap className="size-4" />
                  Otevřené hry
                </Link>
              </div>
            </div>
          </div>

          {/* decorative ball bottom-right */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            aria-hidden
            className="absolute -bottom-4 -right-4 drop-shadow-md"
          >
            <circle cx="60" cy="60" r="54" fill="#D4ED4C" />
            <path
              d="M14 48 C30 84, 90 36, 106 72"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Side: session card */}
        <div className="md:col-span-4 grid grid-rows-2 gap-6">
          <div className="rounded-3xl bg-surface-raised p-6 shadow-soft ring-1 ring-border">
            <div className="text-caption">01 — Brand</div>
            <Wordmark className="mt-3 text-3xl" />
            <p className="mt-3 text-sm text-foreground-muted">
              Rezervační platforma pro padel kluby, otevřené hry a komunitní ligu.
              Česky, přehledně, bez tření.
            </p>
          </div>
          <div className="rounded-3xl bg-accent p-6 shadow-soft text-accent-foreground flex flex-col justify-between">
            <div className="text-[11px] font-mono uppercase tracking-[0.08em] opacity-75">
              {session?.user ? "Přihlášen" : "Testovací účet"}
            </div>
            {session?.user ? (
              <div className="mt-3">
                <div className="font-display text-2xl">
                  Ahoj, {session.user.name?.split(" ")[0] ?? "hráč"}.
                </div>
                <Link
                  href="/moje-rezervace"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4"
                >
                  Moje rezervace
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ) : (
              <div className="mt-3 space-y-1.5 text-sm">
                <div className="font-semibold">hrac@padel.local</div>
                <div className="font-mono text-xs">heslo: hrac123</div>
                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4"
                >
                  Přihlásit se
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Live signály */}
      <section className="grid gap-4 md:grid-cols-2">
        <SignalCard
          caption="02 — Dnes volno"
          title="Nejbližší volné sloty"
          linkHref="/rezervace"
          linkText="Všechny kurty"
          empty={
            <p className="text-sm text-foreground-muted">
              Dnes už jsou sloty pryč. Mrkni na{" "}
              <Link href="/rezervace" className="underline">
                zítřek
              </Link>
              .
            </p>
          }
          items={todaysFreeSlots.map((s) => ({
            key: s.courtId,
            href: `/rezervace/${s.courtId}?date=${today}`,
            left: (
              <>
                <span className="font-display text-xl text-primary tnum">{s.time}</span>
                <span className="text-sm text-foreground-muted">{s.courtName}</span>
              </>
            ),
            right: (
              <ArrowRight className="size-3.5 text-foreground-subtle transition group-hover:translate-x-0.5 group-hover:text-primary" />
            ),
          }))}
        />

        <SignalCard
          caption="03 — Otevřené hry"
          title="Hledají spoluhráče"
          linkHref="/hry"
          linkText="Všechny hry"
          empty={
            <p className="text-sm text-foreground-muted">
              Zatím žádná otevřená hra. Založ si{" "}
              <Link href="/rezervace" className="underline">
                vlastní
              </Link>{" "}
              a označ ji jako otevřenou.
            </p>
          }
          items={openGames.map((g) => {
            const free = Math.max(0, g.neededPlayers - g._count.guests);
            return {
              key: g.id,
              href: `/hry/${g.id}`,
              left: (
                <>
                  <span className="font-display text-xl text-primary tnum">
                    {formatTimeCZ(g.startAt)}
                  </span>
                  <span className="text-sm text-foreground-muted">{g.court.name}</span>
                </>
              ),
              right: (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                  {spotsLabel(free)}
                </span>
              ),
            };
          })}
        />
      </section>

      {/* Feature strip */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <div className="text-caption">04 — Co nabízíme</div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<CalendarClock className="size-5" />}
            title="Rezervace za 30 sekund"
            desc="Vyber kurt, klikni na volný slot, potvrď. Bez telefonátů."
          />
          <FeatureCard
            icon={<Users className="size-5" />}
            title="Najdi si partii"
            desc="Označ rezervaci jako otevřenou – doplníme ti hráče na tvé úrovni."
            accent
          />
          <FeatureCard
            icon={<Zap className="size-5" />}
            title="Žádné překvapení"
            desc="Dostupnost v reálném čase, přehled rezervací a jedno klepnutí pro zrušení."
          />
        </div>
      </section>
    </div>
  );
}

function SignalCard({
  caption,
  title,
  linkHref,
  linkText,
  items,
  empty,
}: {
  caption: string;
  title: string;
  linkHref: string;
  linkText: string;
  items: Array<{
    key: string;
    href: string;
    left: React.ReactNode;
    right: React.ReactNode;
  }>;
  empty: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-surface-raised p-6 shadow-soft ring-1 ring-border space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-caption">{caption}</div>
          <h2 className="mt-1 font-display text-2xl">{title}</h2>
        </div>
        <Link
          href={linkHref}
          className="shrink-0 text-xs font-semibold text-primary hover:underline"
        >
          {linkText} →
        </Link>
      </div>
      {items.length === 0 ? (
        empty
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.key}>
              <Link
                href={it.href}
                className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition hover:border-primary hover:bg-primary-soft"
              >
                <span className="flex items-center gap-3">{it.left}</span>
                {it.right}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-3xl bg-accent text-accent-foreground p-6 shadow-soft"
          : "rounded-3xl bg-surface-raised p-6 shadow-soft ring-1 ring-border"
      }
    >
      <div
        className={
          "grid size-10 place-items-center rounded-xl " +
          (accent ? "bg-accent-foreground/10 text-accent-foreground" : "bg-primary-soft text-primary")
        }
      >
        {icon}
      </div>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className={"mt-1.5 text-sm " + (accent ? "text-accent-foreground/80" : "text-foreground-muted")}>
        {desc}
      </p>
    </div>
  );
}
