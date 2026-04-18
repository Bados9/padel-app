import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTimeCZ, formatTimeCZ, todayInClubTz, clubLocalToUtc } from "@/lib/time";

export const metadata = { title: "Admin · Padel klub" };

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
      <h1 className="text-2xl font-bold tracking-tight">Přehled klubu</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Aktivní kurty" value={courtsCount} />
        <Stat label="Rezervace dnes" value={todayReservations} />
        <Stat label="Rezervace tento týden" value={weekReservations} />
        <Stat label="Otevřené hry" value={openGames} />
        <Stat label="Uživatelé" value={usersCount} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Nejbližší rezervace</h2>
        {nextReservations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné nadcházející rezervace.</p>
        ) : (
          <div className="grid gap-2">
            {nextReservations.map((r) => (
              <Card key={r.id} size="sm">
                <CardContent className="pt-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <div className="font-medium">{r.court.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTimeCZ(r.startAt)} – {formatTimeCZ(r.endAt)} · {r.owner.name}
                    </div>
                  </div>
                  <Link
                    href="/admin/rezervace"
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Detail →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
