import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTimeCZ, formatTimeCZ } from "@/lib/time";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CancelButton } from "@/components/reservations/cancel-button";

export const metadata = { title: "Moje rezervace · Padel klub" };

type PageProps = {
  searchParams: Promise<{ created?: string }>;
};

export default async function MyReservationsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/moje-rezervace");
  }

  const sp = await searchParams;
  const now = new Date();

  const [upcoming, past] = await Promise.all([
    db.reservation.findMany({
      where: {
        ownerId: session.user.id,
        status: "CONFIRMED",
        endAt: { gt: now },
      },
      orderBy: { startAt: "asc" },
      include: { court: { select: { id: true, name: true } } },
    }),
    db.reservation.findMany({
      where: {
        ownerId: session.user.id,
        OR: [
          { status: "CANCELLED" },
          { endAt: { lte: now } },
        ],
      },
      orderBy: { startAt: "desc" },
      take: 20,
      include: { court: { select: { id: true, name: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Moje rezervace</h1>
        <p className="text-muted-foreground text-sm">
          Přehled tvých termínů a možnost je zrušit (pokud ještě nezačaly).
        </p>
      </header>

      {sp.created ? (
        <Alert>
          <AlertTitle>Rezervace uložena</AlertTitle>
          <AlertDescription>
            Termín najdeš níž v sekci <em>Nadcházející</em>.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Nadcházející</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Zatím žádná rezervace.{" "}
            <Link href="/rezervace" className="underline">
              Zarezervovat kurt
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-3">
            {upcoming.map((r) => (
              <Card key={r.id}>
                <CardContent className="pt-4 flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/rezervace/${r.court.id}`}
                        className="font-semibold hover:underline"
                      >
                        {r.court.name}
                      </Link>
                      <Badge variant="secondary" className="text-xs">
                        {r.visibility === "PUBLIC" ? "Otevřená" : "Soukromá"}
                      </Badge>
                    </div>
                    <p className="text-sm">
                      {formatDateTimeCZ(r.startAt)} – {formatTimeCZ(r.endAt)}
                    </p>
                    {r.visibility === "PUBLIC" ? (
                      <p className="text-xs text-muted-foreground">
                        hledá {r.neededPlayers}{" "}
                        {r.neededPlayers === 1 ? "hráče" : "hráče/ů"}
                        {r.preferredLevel ? ` · ${r.preferredLevel}` : ""}
                      </p>
                    ) : null}
                    {r.notes ? (
                      <p className="text-xs text-muted-foreground italic">
                        „{r.notes}"
                      </p>
                    ) : null}
                  </div>
                  <CancelButton reservationId={r.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Historie & zrušené</h2>
        {past.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nic k zobrazení.</p>
        ) : (
          <div className="grid gap-2">
            {past.map((r) => (
              <Card key={r.id} size="sm">
                <CardContent className="pt-3 flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.court.name}</span>
                      <Badge
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {r.status === "CANCELLED" ? "zrušeno" : "odehráno"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTimeCZ(r.startAt)} – {formatTimeCZ(r.endAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
