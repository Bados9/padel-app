import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatDateTimeCZ, formatTimeCZ } from "@/lib/time";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { JoinLeaveButton } from "@/components/reservations/join-leave-button";

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Začátečník",
  INTERMEDIATE: "Mírně pokročilý",
  ADVANCED: "Pokročilý",
  PRO: "Závodní",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function GameDetailPage({ params }: PageProps) {
  const { id } = await params;

  const game = await db.reservation.findUnique({
    where: { id },
    include: {
      court: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, level: true } },
      guests: {
        include: { user: { select: { id: true, name: true, level: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
  if (!game || game.visibility !== "PUBLIC") notFound();

  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  const isOwner = viewerId === game.owner.id;
  const isGuest = !!game.guests.find((g) => g.userId === viewerId);
  const totalPlayers = 1 + game.guests.length;
  const freeSpots = Math.max(0, game.neededPlayers - game.guests.length);
  const started = game.startAt.getTime() <= Date.now();
  const isCancelled = game.status === "CANCELLED";

  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/hry/${id}`)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <Link
        href="/hry"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Všechny otevřené hry
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Hra na kurtu {game.court.name}
          </h1>
          <Badge variant="secondary">
            {totalPlayers}/4 hráčů
          </Badge>
          {game.preferredLevel ? (
            <Badge variant="outline">
              {LEVEL_LABEL[game.preferredLevel]}
            </Badge>
          ) : null}
        </div>
        <p className="text-muted-foreground">
          {formatDateTimeCZ(game.startAt)} – {formatTimeCZ(game.endAt)}
        </p>
      </header>

      {isCancelled ? (
        <Alert variant="destructive">
          <AlertTitle>Hra byla zrušena</AlertTitle>
        </Alert>
      ) : null}

      {game.notes ? (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm italic text-muted-foreground">„{game.notes}"</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="pt-5 space-y-3">
          <h2 className="font-semibold">Hráči</h2>
          <ul className="space-y-1.5 text-sm">
            <li className="flex items-center justify-between gap-2">
              <span>
                <strong>{game.owner.name}</strong>
                <span className="text-muted-foreground">
                  {game.owner.level ? ` · ${LEVEL_LABEL[game.owner.level]}` : ""} · organizátor
                </span>
              </span>
            </li>
            {game.guests.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2">
                <span>
                  {g.user.name}
                  <span className="text-muted-foreground">
                    {g.user.level ? ` · ${LEVEL_LABEL[g.user.level]}` : ""}
                  </span>
                </span>
              </li>
            ))}
            {Array.from({ length: freeSpots }).map((_, i) => (
              <li key={`free-${i}`} className="text-muted-foreground italic">
                — volné místo —
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {!isCancelled && !started ? (
        <div className="flex items-center gap-3 flex-wrap">
          {!viewerId ? (
            <Link
              href={loginHref}
              className={buttonVariants({ size: "sm" })}
            >
              Přihlásit se pro účast
            </Link>
          ) : isOwner ? (
            <p className="text-sm text-muted-foreground">
              Jsi organizátor. Zrušit hru můžeš v{" "}
              <Link href="/moje-rezervace" className="underline">
                Moje rezervace
              </Link>
              .
            </p>
          ) : isGuest ? (
            <JoinLeaveButton reservationId={game.id} mode="leave" />
          ) : (
            <JoinLeaveButton
              reservationId={game.id}
              mode="join"
              disabled={freeSpots === 0}
              disabledReason={freeSpots === 0 ? "Hra je plná" : undefined}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
