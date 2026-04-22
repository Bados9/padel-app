import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CircleX,
  UserRound,
  UsersRound,
} from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatDateCZ, formatTimeCZ } from "@/lib/time";
import {
  LEVEL_LABEL,
  relativeTimeCs,
  spotsLabel,
} from "@/lib/labels";
import { JoinLeaveButton } from "@/components/reservations/join-leave-button";

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
  const rel = relativeTimeCs(game.startAt);

  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/hry/${id}`)}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <Link
        href="/hry"
        className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition"
      >
        <ArrowLeft className="size-3.5" />
        Všechny otevřené hry
      </Link>

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl court-grad p-6 sm:p-8 shadow-soft text-white">
        <svg
          viewBox="0 0 700 220"
          preserveAspectRatio="none"
          aria-hidden
          className="absolute inset-0 h-full w-full opacity-55"
        >
          <rect x="40" y="30" width="620" height="160" fill="none" stroke="#fff" strokeWidth="2.5" />
          <line x1="350" y1="30" x2="350" y2="190" stroke="#fff" strokeWidth="2.5" />
          <line x1="40" y1="110" x2="660" y2="110" stroke="#fff" strokeWidth="2" />
        </svg>
        <svg
          width="90"
          height="90"
          viewBox="0 0 90 90"
          aria-hidden
          className="absolute -bottom-3 -right-3 drop-shadow"
        >
          <circle cx="45" cy="45" r="40" fill="#D4ED4C" />
          <path d="M10 36 C22 62, 66 28, 80 54" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
        <div className="relative space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-white/85">
            Otevřená hra · {totalPlayers}/4
          </div>
          <div className="font-display text-[clamp(2.5rem,6vw,4rem)] leading-none tnum">
            {formatTimeCZ(game.startAt)}
            <span className="text-white/60 mx-1">–</span>
            {formatTimeCZ(game.endAt)}
          </div>
          <p className="text-sm text-white/85">
            {formatDateCZ(game.startAt)}
            {rel ? <span className="font-semibold text-accent"> · {rel}</span> : null}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            <Link
              href={`/rezervace/${game.court.id}`}
              className="pill inline-flex items-center bg-white px-3 py-1 text-sm font-semibold text-primary hover:-translate-y-0.5 transition"
            >
              {game.court.name}
            </Link>
            {game.preferredLevel ? (
              <span className="pill inline-flex items-center bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
                {LEVEL_LABEL[game.preferredLevel]}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {isCancelled ? (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-danger">
          <CircleX className="size-5 shrink-0 mt-0.5" />
          <div className="text-sm font-semibold">Hra byla zrušena</div>
        </div>
      ) : null}

      {game.notes ? (
        <div className="rounded-3xl bg-accent-soft p-5 ring-1 ring-accent/40">
          <p className="text-sm italic text-accent-foreground">
            „{game.notes}“
          </p>
        </div>
      ) : null}

      {/* Players */}
      <div className="rounded-3xl bg-surface-raised p-6 shadow-soft ring-1 ring-border space-y-4">
        <h2 className="font-display text-2xl">Hráči</h2>
        <ul className="space-y-1.5">
          <PlayerRow
            name={game.owner.name}
            level={game.owner.level}
            role="organizátor"
            self={isOwner}
          />
          {game.guests.map((g) => (
            <PlayerRow
              key={g.id}
              name={g.user.name}
              level={g.user.level}
              role="host"
              self={g.userId === viewerId}
            />
          ))}
          {Array.from({ length: freeSpots }).map((_, i) => (
            <li
              key={`free-${i}`}
              className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-foreground-subtle"
            >
              <span className="grid size-7 place-items-center rounded-full bg-surface-sunken">
                <UserRound className="size-3.5" />
              </span>
              volné místo
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      {!isCancelled && !started ? (
        <div className="flex flex-wrap items-center gap-3">
          {!viewerId ? (
            <Link
              href={loginHref}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary-hover transition"
            >
              Přihlásit se pro účast
            </Link>
          ) : isOwner ? (
            <p className="text-sm text-foreground-muted">
              Jsi organizátor. Zrušit hru můžeš v{" "}
              <Link href="/moje-rezervace" className="underline">
                Moje rezervace
              </Link>
              .
            </p>
          ) : isGuest ? (
            <JoinLeaveButton
              key={`leave-${game.id}`}
              reservationId={game.id}
              mode="leave"
            />
          ) : (
            <JoinLeaveButton
              key={`join-${game.id}`}
              reservationId={game.id}
              mode="join"
              disabled={freeSpots === 0}
              disabledReason={freeSpots === 0 ? "Hra je plná" : undefined}
            />
          )}
          {!isOwner && viewerId && freeSpots > 0 && !isGuest ? (
            <p className="text-xs text-foreground-subtle">
              Zbývá {spotsLabel(freeSpots)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PlayerRow({
  name,
  level,
  role,
  self,
}: {
  name: string;
  level: string | null;
  role: string;
  self: boolean;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg bg-surface-sunken px-3 py-2 text-sm">
      <span className="grid size-7 place-items-center rounded-full bg-surface-raised text-foreground-muted">
        <UsersRound className="size-3.5" />
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {name}
            {self ? (
              <span className="ml-1 text-xs text-primary">(ty)</span>
            ) : null}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-foreground-subtle">
            {role}
          </span>
        </div>
        {level ? (
          <p className="text-xs text-foreground-subtle">
            {LEVEL_LABEL[level as keyof typeof LEVEL_LABEL] ?? level}
          </p>
        ) : null}
      </div>
    </li>
  );
}
