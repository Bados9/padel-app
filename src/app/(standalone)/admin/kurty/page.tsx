import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Admin – Kurty" };

const SURFACE_LABEL: Record<string, string> = {
  ARTIFICIAL_GRASS: "Umělá tráva",
  CARPET: "Koberec",
  CONCRETE: "Beton",
};

export default async function AdminCourtsPage() {
  const courts = await db.court.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { reservations: true, openingHours: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Kurty</h1>
        <Link
          href="/admin/kurty/novy"
          className={buttonVariants({ size: "sm" })}
        >
          + Nový kurt
        </Link>
      </div>

      {courts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Žádné kurty.{" "}
          <Link href="/admin/kurty/novy" className="underline">
            Vytvořit první
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-3">
          {courts.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-4 flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/kurty/${c.id}`}
                      className="font-semibold hover:underline"
                    >
                      {c.name}
                    </Link>
                    {!c.active ? (
                      <Badge variant="secondary" className="text-xs">
                        neaktivní
                      </Badge>
                    ) : null}
                    <Badge variant="outline" className="text-xs">
                      {c.indoor ? "Krytý" : "Venkovní"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {SURFACE_LABEL[c.surface] ?? c.surface} · {c._count.reservations} rezervací · {c._count.openingHours} otevřených dnů
                  </p>
                </div>
                <Link
                  href={`/admin/kurty/${c.id}`}
                  className={buttonVariants({ size: "sm", variant: "outline" })}
                >
                  Upravit
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
