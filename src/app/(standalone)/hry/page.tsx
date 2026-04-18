import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatDateTimeCZ, formatTimeCZ } from "@/lib/time";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Otevřené hry · Padel klub" };

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Začátečník",
  INTERMEDIATE: "Mírně pokročilý",
  ADVANCED: "Pokročilý",
  PRO: "Závodní",
};

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
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Otevřené hry</h1>
        <p className="text-muted-foreground">
          Přidej se k rezervaci jiného hráče – padel se hraje ve čtyřech.
        </p>
      </header>

      <nav className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Úroveň:</span>
        <Link
          href="/hry"
          className={`rounded-md px-2 py-1 ${!levelFilter ? "bg-emerald-600 text-white" : "hover:bg-muted"}`}
        >
          Vše
        </Link>
        {LEVELS.map((l) => (
          <Link
            key={l}
            href={`/hry?level=${l}`}
            className={`rounded-md px-2 py-1 ${levelFilter === l ? "bg-emerald-600 text-white" : "hover:bg-muted"}`}
          >
            {LEVEL_LABEL[l]}
          </Link>
        ))}
      </nav>

      {games.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Zatím žádná otevřená hra{levelFilter ? " pro vybranou úroveň" : ""}.{" "}
          <Link href="/rezervace" className="underline">
            Založ si vlastní rezervaci
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-3">
          {games.map((g) => {
            const totalPlayers = 1 + g._count.guests; // owner + guests
            const freeSpots = Math.max(0, g.neededPlayers - g._count.guests);
            const isFull = freeSpots === 0;
            const isOwner = session?.user?.id === g.owner.id;
            return (
              <Card key={g.id}>
                <CardContent className="pt-5 flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{g.court.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {totalPlayers}/4 hráčů
                      </Badge>
                      {g.preferredLevel ? (
                        <Badge variant="outline" className="text-xs">
                          {LEVEL_LABEL[g.preferredLevel]}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm">
                      {formatDateTimeCZ(g.startAt)} – {formatTimeCZ(g.endAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Organizuje {g.owner.name}
                      {g.owner.level ? ` · ${LEVEL_LABEL[g.owner.level]}` : ""}
                    </p>
                    {g.notes ? (
                      <p className="text-xs text-muted-foreground italic">„{g.notes}"</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">
                      {isFull ? "plné" : `${freeSpots} volné místo${freeSpots === 1 ? "" : freeSpots < 5 ? "a" : ""}`}
                    </span>
                    <Link
                      href={`/hry/${g.id}`}
                      className={buttonVariants({ size: "sm", variant: isOwner ? "outline" : "default" })}
                    >
                      {isOwner ? "Detail (tvá hra)" : "Přihlásit se"}
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
