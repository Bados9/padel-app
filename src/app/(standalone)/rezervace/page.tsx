import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const SURFACE_LABEL: Record<string, string> = {
  ARTIFICIAL_GRASS: "Umělá tráva",
  CARPET: "Koberec",
  CONCRETE: "Beton",
};

export const metadata = { title: "Rezervace kurtů · Padel klub" };

export default async function CourtsPage() {
  const courts = await db.court.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      openingHours: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { reservations: true } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Rezervace kurtů</h1>
        <p className="text-muted-foreground">
          Vyber si kurt a pokračuj na denní kalendář s dostupnými sloty.
        </p>
      </header>

      {courts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Žádné aktivní kurty.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courts.map((c) => {
            const first = c.openingHours[0];
            const openingSummary = first
              ? `${first.startTime}–${first.endTime}`
              : "bez otvírací doby";
            return (
              <Card key={c.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-lg">{c.name}</h2>
                    <Badge variant="secondary" className="text-xs">
                      {c.indoor ? "Krytý" : "Venkovní"}
                    </Badge>
                  </div>
                  {c.description ? (
                    <p className="text-sm text-muted-foreground">
                      {c.description}
                    </p>
                  ) : null}
                  <dl className="text-sm grid grid-cols-2 gap-y-1">
                    <dt className="text-muted-foreground">Povrch</dt>
                    <dd>{SURFACE_LABEL[c.surface] ?? c.surface}</dd>
                    <dt className="text-muted-foreground">Otevírací doba</dt>
                    <dd>{openingSummary}</dd>
                  </dl>
                  <div className="pt-2">
                    <Link
                      href={`/rezervace/${c.id}`}
                      className={buttonVariants({ size: "sm" })}
                    >
                      Zobrazit dostupnost
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
