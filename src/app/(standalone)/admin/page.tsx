import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateTimeCZ, formatTimeCZ, todayInClubTz, clubLocalToUtc } from "@/lib/time";

export const metadata = { title: "Admin · Hraj:Padel" };

export default async function AdminDashboardPage() {
  const today = todayInClubTz();
  const todayStart = clubLocalToUtc(today, "00:00");
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60_000);
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60_000);
  const now = new Date();

  const [
    courtsCount,
    usersCount,
    todayReservations,
    weekReservations,
    openGames,
    nextReservations,
  ] = await Promise.all([
    db.court.count({ where: { active: true } }),
    db.user.count(),
    db.reservation.count({
      where: {
        status: "CONFIRMED",
        startAt: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    db.reservation.count({
      where: {
        status: "CONFIRMED",
        startAt: { gte: todayStart, lt: weekEnd },
      },
    }),
    db.reservation.count({
      where: {
        status: "CONFIRMED",
        visibility: "PUBLIC",
        startAt: { gt: now },
        neededPlayers: { gt: 0 },
      },
    }),
    db.reservation.findMany({
      where: { status: "CONFIRMED", endAt: { gt: now } },
      orderBy: { startAt: "asc" },
      take: 8,
      include: {
        court: { select: { name: true } },
        owner: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-caption">Admin · Přehled</div>
        <h1 className="text-h1">Přehled klubu</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Aktivní kurty" value={courtsCount} />
        <Stat label="Rezervace dnes" value={todayReservations} accent />
        <Stat label="Tento týden" value={weekReservations} />
        <Stat label="Otevřené hry" value={openGames} />
        <Stat label="Uživatelé" value={usersCount} />
      </div>

      <section className="rounded-3xl bg-surface-raised p-6 shadow-softer ring-1 ring-border space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Nejbližší rezervace</h2>
          <Link
            href="/admin/rezervace"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Všechny →
          </Link>
        </div>
        {nextReservations.length === 0 ? (
          <p className="text-sm text-foreground-muted">Žádné nadcházející rezervace.</p>
        ) : (
          <div className="grid gap-2">
            {nextReservations.map((r) => (
              <Link
                key={r.id}
                href="/admin/rezervace"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3 transition hover:border-primary hover:bg-primary-soft"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold group-hover:text-primary transition">{r.court.name}</div>
                  <div className="text-xs text-foreground-subtle tnum">
                    {formatDateTimeCZ(r.startAt)} – {formatTimeCZ(r.endAt)} · {r.owner.name}
                  </div>
                </div>
                <span className="text-xs font-semibold text-foreground-subtle group-hover:text-primary transition">
                  Detail →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-2xl bg-accent p-4 text-accent-foreground shadow-soft"
          : "rounded-2xl bg-surface-raised p-4 shadow-softer ring-1 ring-border"
      }
    >
      <div className="text-[10px] font-mono uppercase tracking-[0.08em] opacity-70">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl leading-none tnum">{value}</div>
    </div>
  );
}
