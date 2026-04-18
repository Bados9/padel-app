import Link from "next/link";
import { db } from "@/lib/db";
import { formatDateTimeCZ, formatTimeCZ } from "@/lib/time";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CancelButton } from "@/components/reservations/cancel-button";
import { STATUS_LABEL, VISIBILITY_LABEL } from "@/lib/labels";

export const metadata = { title: "Admin – Rezervace" };

type PageProps = {
  searchParams: Promise<{ status?: string; scope?: string }>;
};

const SCOPES = [
  { v: "upcoming", label: "Nadcházející" },
  { v: "past", label: "Historie" },
  { v: "all", label: "Vše" },
];

export default async function AdminReservationsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const scope = sp.scope === "past" || sp.scope === "all" ? sp.scope : "upcoming";
  const now = new Date();

  const where =
    scope === "upcoming"
      ? { endAt: { gt: now } }
      : scope === "past"
        ? { endAt: { lte: now } }
        : {};

  const reservations = await db.reservation.findMany({
    where,
    orderBy: { startAt: scope === "past" ? "desc" : "asc" },
    take: 100,
    include: {
      court: { select: { name: true } },
      owner: { select: { name: true, email: true } },
      _count: { select: { guests: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Rezervace</h1>
        <nav className="flex gap-1 text-sm">
          {SCOPES.map((s) => (
            <Link
              key={s.v}
              href={`/admin/rezervace?scope=${s.v}`}
              className={`rounded-md px-2 py-1 ${
                scope === s.v ? "bg-emerald-600 text-white" : "hover:bg-muted"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </div>

      {reservations.length === 0 ? (
        <p className="text-sm text-muted-foreground">Žádné rezervace.</p>
      ) : (
        <div className="grid gap-2">
          {reservations.map((r) => (
            <Card key={r.id} size="sm">
              <CardContent className="pt-3 flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.court.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {STATUS_LABEL[r.status]}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {VISIBILITY_LABEL[r.visibility]}
                    </Badge>
                    {r.visibility === "PUBLIC" ? (
                      <Badge variant="outline" className="text-[10px]">
                        {1 + r._count.guests}/4
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs">
                    {formatDateTimeCZ(r.startAt)} – {formatTimeCZ(r.endAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.owner.name} · {r.owner.email}
                  </p>
                </div>
                {r.status === "CONFIRMED" ? (
                  <CancelButton reservationId={r.id} />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
