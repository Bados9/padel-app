import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  clubDayOfWeek,
  formatDateCZ,
  generateDaySlots,
  shiftDate,
  todayInClubTz,
} from "@/lib/time";
import { MAX_DAYS_AHEAD } from "@/lib/club";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SlotGrid, type SlotState } from "@/components/reservations/slot-grid";
import {
  ReservationForm,
  type FreeSlot,
} from "@/components/reservations/reservation-form";

type PageProps = {
  params: Promise<{ courtId: string }>;
  searchParams: Promise<{ date?: string; created?: string }>;
};

const DAY_NAMES = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

export default async function CourtDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { courtId } = await params;
  const sp = await searchParams;

  const court = await db.court.findUnique({
    where: { id: courtId },
    include: { openingHours: true },
  });
  if (!court || !court.active) notFound();

  const today = todayInClubTz();
  const maxDate = shiftDate(today, MAX_DAYS_AHEAD);
  const requestedDate = sp.date ?? today;
  const date =
    requestedDate < today
      ? today
      : requestedDate > maxDate
        ? maxDate
        : requestedDate;

  const dow = clubDayOfWeek(date);
  const opening = court.openingHours.find((o) => o.dayOfWeek === dow);

  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const slots = opening ? generateDaySlots(date, opening) : [];

  let states: SlotState[] = [];
  let freeSlots: FreeSlot[] = [];

  if (slots.length > 0) {
    const dayStart = slots[0].startAt;
    const dayEnd = slots[slots.length - 1].endAt;

    const reservations = await db.reservation.findMany({
      where: {
        courtId,
        status: "CONFIRMED",
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      select: { startAt: true, endAt: true, ownerId: true },
    });

    const now = Date.now();
    states = slots.map((s) => {
      if (s.endAt.getTime() <= now) return "past";
      const overlap = reservations.find(
        (r) => r.startAt < s.endAt && r.endAt > s.startAt,
      );
      if (overlap) {
        return viewerId && overlap.ownerId === viewerId ? "own" : "reserved";
      }
      return "free";
    });

    freeSlots = slots
      .map((s, i) => ({ slot: s, state: states[i] }))
      .filter((x) => x.state === "free")
      .map((x) => ({
        startLabel: x.slot.startLabel,
        endLabel: x.slot.endLabel,
        minutes: 30,
      }));
  }

  const prevDate = shiftDate(date, -1);
  const nextDate = shiftDate(date, 1);
  const canGoPrev = prevDate >= today;
  const canGoNext = nextDate <= maxDate;

  const loginHref = `/login?callbackUrl=${encodeURIComponent(
    `/rezervace/${courtId}?date=${date}`,
  )}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div className="space-y-2">
        <Link
          href="/rezervace"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Všechny kurty
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{court.name}</h1>
            {court.description ? (
              <p className="text-muted-foreground">{court.description}</p>
            ) : null}
          </div>
          <Badge variant="secondary">{court.indoor ? "Krytý" : "Venkovní"}</Badge>
        </div>
      </div>

      {sp.created ? (
        <Alert>
          <AlertTitle>Rezervace vytvořena</AlertTitle>
          <AlertDescription>
            Najdeš ji v{" "}
            <Link href="/moje-rezervace" className="underline">
              Moje rezervace
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Den</div>
              <div className="text-lg font-semibold">{formatDateCZ(date)}</div>
              <div className="text-xs text-muted-foreground">
                {DAY_NAMES[dow]}{" "}
                {opening ? (
                  <>
                    · otevřeno {opening.startTime}–{opening.endTime}
                  </>
                ) : (
                  "· zavřeno"
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canGoPrev ? (
                <Link
                  href={`/rezervace/${courtId}?date=${prevDate}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  ← Předchozí
                </Link>
              ) : (
                <span
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "pointer-events-none opacity-40",
                  })}
                >
                  ← Předchozí
                </span>
              )}
              <Link
                href={`/rezervace/${courtId}?date=${today}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Dnes
              </Link>
              {canGoNext ? (
                <Link
                  href={`/rezervace/${courtId}?date=${nextDate}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Další →
                </Link>
              ) : (
                <span
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className: "pointer-events-none opacity-40",
                  })}
                >
                  Další →
                </span>
              )}
            </div>
          </div>

          {opening ? (
            <SlotGrid slots={slots} states={states} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Kurt je v tento den zavřený.
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <LegendDot className="bg-emerald-500/60" /> volné
            <LegendDot className="bg-red-500/60" /> obsazeno
            <LegendDot className="bg-sky-500/60" /> vaše
            <LegendDot className="bg-muted" /> uplynulé
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-lg font-semibold">Nová rezervace</h2>
          <ReservationForm
            courtId={courtId}
            date={date}
            freeSlots={freeSlots}
            isAuthed={!!viewerId}
            loginHref={loginHref}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function LegendDot({ className }: { className: string }) {
  return (
    <span
      className={`inline-block size-2.5 rounded-full border ${className}`}
    />
  );
}
