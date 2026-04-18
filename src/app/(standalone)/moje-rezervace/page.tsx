import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarClock,
  CircleCheck,
  History,
  UsersRound,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateCZ, formatTimeCZ } from "@/lib/time";
import { LEVEL_LABEL, playersLabel, relativeTimeCs } from "@/lib/labels";
import { CancelButton } from "@/components/reservations/cancel-button";
import { JoinLeaveButton } from "@/components/reservations/join-leave-button";

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

  const [upcoming, guestGames, past] = await Promise.all([
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
        status: "CONFIRMED",
        endAt: { gt: now },
        guests: { some: { userId: session.user.id } },
      },
      orderBy: { startAt: "asc" },
      include: {
        court: { select: { id: true, name: true } },
        owner: { select: { name: true } },
      },
    }),
    db.reservation.findMany({
      where: {
        ownerId: session.user.id,
        OR: [{ status: "CANCELLED" }, { endAt: { lte: now } }],
      },
      orderBy: { startAt: "desc" },
      take: 10,
      include: { court: { select: { id: true, name: true } } },
    }),
  ]);

  const combined = [
    ...upcoming.map((r) => ({ kind: "owner" as const, r })),
    ...guestGames.map((r) => ({ kind: "guest" as const, r })),
  ].sort((a, b) => a.r.startAt.getTime() - b.r.startAt.getTime());

  const next = combined[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <header className="space-y-1">
        <div className="text-caption text-foreground-subtle">Přehled</div>
        <h1 className="text-h1">Moje rezervace</h1>
        <p className="text-sm text-foreground-muted">
          Tvoje termíny, hry kde jsi host, a historie.
        </p>
      </header>

      {sp.created ? (
        <div className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success-soft p-4 text-success">
          <CircleCheck className="size-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">Rezervace uložena</div>
            Najdeš ji v sekci <em>Nejbližší</em> níž.
          </div>
        </div>
      ) : null}

      {/* HERO: nejbližší termín s countdownem */}
      {next ? (
        <NextReservationCard
          reservation={next.r}
          kind={next.kind}
          ownerName={next.kind === "guest" ? (next.r as typeof guestGames[number]).owner.name : undefined}
        />
      ) : (
        <EmptyHero />
      )}

      <section className="space-y-3">
        <h2 className="text-h2 flex items-center gap-2">
          <CalendarClock className="size-5 text-foreground-muted" />
          Další termíny
        </h2>
        {combined.length <= 1 ? (
          <p className="text-sm text-foreground-muted">
            Žádné další naplánované termíny.
          </p>
        ) : (
          <div className="grid gap-2.5">
            {combined.slice(1).map(({ kind, r }) => (
              <ReservationRow
                key={r.id}
                reservation={r}
                kind={kind}
                ownerName={
                  kind === "guest"
                    ? (r as typeof guestGames[number]).owner.name
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 ? (
        <details className="group rounded-2xl border border-border bg-surface-raised p-5">
          <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium list-none">
            <span className="inline-flex items-center gap-2 text-foreground-muted group-open:text-foreground">
              <History className="size-4" />
              Historie & zrušené ({past.length})
            </span>
            <span className="text-xs text-foreground-subtle group-open:rotate-180 transition">
              ▾
            </span>
          </summary>
          <div className="mt-4 grid gap-2">
            {past.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.court.name}</span>
                    <span
                      className={
                        r.status === "CANCELLED"
                          ? "text-[10px] uppercase tracking-wider text-danger"
                          : "text-[10px] uppercase tracking-wider text-foreground-subtle"
                      }
                    >
                      {r.status === "CANCELLED" ? "zrušeno" : "odehráno"}
                    </span>
                  </div>
                  <p className="text-xs text-foreground-subtle font-mono tnum">
                    {formatDateCZ(r.startAt)} · {formatTimeCZ(r.startAt)}–
                    {formatTimeCZ(r.endAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

type ReservationFull = {
  id: string;
  startAt: Date;
  endAt: Date;
  visibility: "PRIVATE" | "PUBLIC";
  neededPlayers: number;
  preferredLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "PRO" | null;
  notes: string | null;
  court: { id: string; name: string };
};

function NextReservationCard({
  reservation: r,
  kind,
  ownerName,
}: {
  reservation: ReservationFull;
  kind: "owner" | "guest";
  ownerName?: string;
}) {
  const rel = relativeTimeCs(r.startAt);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-primary-soft p-6 shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-primary/20 blur-2xl"
      />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="text-caption text-primary">Nejbližší</div>
            <div className="font-mono tnum text-h1 text-foreground leading-none">
              {formatTimeCZ(r.startAt)}
              <span className="text-foreground-muted mx-1">–</span>
              {formatTimeCZ(r.endAt)}
            </div>
            <p className="text-sm text-foreground-muted">
              {formatDateCZ(r.startAt)}
              {rel ? <span className="text-primary font-medium"> · {rel}</span> : null}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {kind === "guest" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2.5 py-1 text-xs font-medium text-info">
                <UsersRound className="size-3" />
                host u {ownerName}
              </span>
            ) : r.visibility === "PUBLIC" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/40 px-2.5 py-1 text-xs font-medium text-accent-foreground">
                otevřená
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap border-t border-primary/20 pt-4">
          <Link
            href={`/rezervace/${r.court.id}`}
            className="font-semibold hover:underline"
          >
            {r.court.name}
          </Link>
          <div className="flex items-center gap-2">
            {kind === "guest" ? (
              <JoinLeaveButton reservationId={r.id} mode="leave" />
            ) : (
              <CancelButton reservationId={r.id} />
            )}
          </div>
        </div>

        {r.visibility === "PUBLIC" && kind === "owner" ? (
          <p className="text-xs text-foreground-subtle">
            Hledáš {playersLabel(r.neededPlayers)}
            {r.preferredLevel
              ? ` · úroveň ${LEVEL_LABEL[r.preferredLevel]}`
              : ""}
          </p>
        ) : null}

        {r.notes ? (
          <p className="text-xs italic text-foreground-muted">„{r.notes}“</p>
        ) : null}
      </div>
    </div>
  );
}

function ReservationRow({
  reservation: r,
  kind,
  ownerName,
}: {
  reservation: ReservationFull;
  kind: "owner" | "guest";
  ownerName?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4 flex items-start justify-between gap-4 flex-wrap">
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={
              kind === "guest"
                ? `/hry/${r.id}`
                : `/rezervace/${r.court.id}`
            }
            className="font-semibold hover:text-primary transition"
          >
            {r.court.name}
          </Link>
          {kind === "guest" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-info-soft px-2 py-0.5 text-[10px] font-medium text-info uppercase tracking-wider">
              host · {ownerName}
            </span>
          ) : r.visibility === "PUBLIC" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/40 px-2 py-0.5 text-[10px] font-medium text-accent-foreground uppercase tracking-wider">
              otevřená
            </span>
          ) : null}
        </div>
        <p className="text-sm font-mono tnum">
          {formatDateCZ(r.startAt)} · {formatTimeCZ(r.startAt)}–
          {formatTimeCZ(r.endAt)}
        </p>
        <p className="text-xs text-foreground-subtle">
          {relativeTimeCs(r.startAt) || null}
        </p>
      </div>
      <div>
        {kind === "guest" ? (
          <JoinLeaveButton reservationId={r.id} mode="leave" />
        ) : (
          <CancelButton reservationId={r.id} />
        )}
      </div>
    </div>
  );
}

function EmptyHero() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-sunken/50 p-8 text-center space-y-3">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-surface-raised text-foreground-muted">
        <CalendarClock className="size-6" />
      </div>
      <h2 className="text-h3">Zatím žádná rezervace</h2>
      <p className="text-sm text-foreground-muted">
        Vyber si kurt a termín – pár kliknutí.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        <Link
          href="/rezervace"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary-hover transition"
        >
          Rezervovat kurt
        </Link>
        <Link
          href="/hry"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm font-medium hover:bg-surface-sunken transition"
        >
          Otevřené hry
        </Link>
      </div>
    </div>
  );
}
