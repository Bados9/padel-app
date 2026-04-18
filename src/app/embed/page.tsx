import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Rezervace padelu" };

const SURFACE_LABEL: Record<string, string> = {
  ARTIFICIAL_GRASS: "Umělá tráva",
  CARPET: "Koberec",
  CONCRETE: "Beton",
};

export default async function EmbedHome() {
  const courts = await db.court.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      openingHours: { orderBy: { dayOfWeek: "asc" }, take: 1 },
    },
  });

  return (
    <div className="p-5 space-y-5">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-emerald-600">●</span>
          <span className="text-sm font-semibold">Padel klub</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">Vyber kurt a termín</h1>
        <p className="text-xs text-muted-foreground">
          Rezervace probíhá v novém okně – vyžaduje přihlášení hráče.
        </p>
      </header>

      {courts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Žádné aktivní kurty.</p>
      ) : (
        <div className="grid gap-3">
          {courts.map((c) => {
            const opening = c.openingHours[0];
            return (
              <Card key={c.id} size="sm">
                <CardContent className="pt-3 flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{c.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {c.indoor ? "Krytý" : "Venkovní"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {SURFACE_LABEL[c.surface] ?? c.surface}
                      {opening ? ` · ${opening.startTime}–${opening.endTime}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/rezervace/${c.id}`}
                    target="_top"
                    className={buttonVariants({ size: "sm" })}
                  >
                    Rezervovat
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        Embed rezervace · Padel klub
      </p>
    </div>
  );
}
