import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CircleCheck,
  Home,
  Layers,
  Sun,
} from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  clubDayOfWeek,
  formatDateCZ,
  formatTimeCZ,
  generateDaySlots,
  shiftDate,
  todayInClubTz,
} from "@/lib/time";
import { MAX_DAYS_AHEAD } from "@/lib/club";
import { SURFACE_LABEL } from "@/lib/labels";
import {
  ReservationPicker,
  type PickerSlot,
  type SlotState,
} from "@/components/reservations/reservation-picker";

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
  const isOpen = !!opening;

  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  // Generuj sloty + jejich stavy
  const daySlots = opening ? generateDaySlots(date, opening) : [];
  let pickerSlots: PickerSlot[] = [];

  if (daySlots.length > 0) {
    const dayStart = daySlots[0].startAt;
    const dayEnd = daySlots[daySlots.length - 1].endAt;

    const reservations = await db.reservation.findMany({
      where: {
        courtId,
        status: "CONFIRMED",
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        ownerId: true,
        visibility: true,
        neededPlayers: true,
        _count: { select: { guests: true } },
        guests: viewerId
          ? { where: { userId: viewerId }, select: { userId: true } }
          : false,
      },
    });

    const now = Date.now();
    pickerSlots = daySlots.map((s) => {
      if (s.endAt.getTime() <= now) {
        return {
          startLabel: s.startLabel,
          endLabel: s.endLabel,
          state: "past" as SlotState,
        };
      }
      const overlap = reservations.find(
        (r) => r.startAt < s.endAt && r.endAt > s.startAt,
      );
      if (!overlap) {
        return {
          startLabel: s.startLabel,
          endLabel: s.endLabel,
          state: "free" as SlotState,
        };
      }

      const isOwner = viewerId ? overlap.ownerId === viewerId : false;
      const isGuest = viewerId ? (overlap.guests?.length ?? 0) > 0 : false;
      const freeSpots = Math.max(
        0,
        overlap.neededPlayers - overlap._count.guests,
      );
      const isOpenPublic =
        overlap.visibility === "PUBLIC" && freeSpots > 0;

      if (isOwner || isGuest) {
        return {
          startLabel: s.startLabel,
          endLabel: s.endLabel,
          state: "own" as SlotState,
          // U PUBLIC hry linkujeme na detail (pro správu i případný odchod)
          linkHref:
            overlap.visibility === "PUBLIC" ? `/hry/${overlap.id}` : undefined,
        };
      }

      if (isOpenPublic) {
        return {
          startLabel: s.startLabel,
          endLabel: s.endLabel,
          state: "open" as SlotState,
          linkHref: `/hry/${overlap.id}`,
          freeSpots,
        };
      }

      return {
        startLabel: s.startLabel,
        endLabel: s.endLabel,
        state: "reserved" as SlotState,
      };
    });
  }

  // Week strip: 7 dnů kolem "date"; střed je aktuálně zobrazovaný den, ale
  // klidně mohou být dny v minulosti/budoucnosti – disable podle today/maxDate.
  const weekStripStart = shiftDate(date, -3);
  const weekStrip = Array.from({ length: 7 }).map((_, i) => {
    const d = shiftDate(weekStripStart, i);
    const jsDate = new Date(`${d}T12:00:00Z`);
    return {
      date: d,
      dayName: DAY_NAMES[clubDayOfWeek(d)],
      dayNum: jsDate.getUTCDate().toString(),
      isToday: d === today,
      isCurrent: d === date,
      isDisabled: d < today || d > maxDate,
    };
  });

  // Nejbližší otevřený den v případě, že je kurt zavřený
  let nextOpenDate: string | null = null;
  if (!isOpen) {
    for (let i = 1; i <= MAX_DAYS_AHEAD; i++) {
      const candidate = shiftDate(date, i);
      if (candidate > maxDate) break;
      const cDow = clubDayOfWeek(candidate);
      if (court.openingHours.some((o) => o.dayOfWeek === cDow)) {
        nextOpenDate = candidate;
        break;
      }
    }
  }

  const prevDate = shiftDate(date, -1);
  const nextDate = shiftDate(date, 1);
  const canGoPrev = prevDate >= today;
  const canGoNext = nextDate <= maxDate;

  const loginHref = `/login?callbackUrl=${encodeURIComponent(
    `/rezervace/${courtId}?date=${date}`,
  )}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div className="space-y-3">
        <Link
          href="/rezervace"
          className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground transition"
        >
          <ArrowLeft className="size-3.5" />
          Všechny kurty
        </Link>

        <div className="relative overflow-hidden rounded-3xl bg-surface-raised shadow-soft ring-1 ring-border">
          <div
            className="absolute inset-x-0 top-0 h-24"
            style={{ background: court.indoor ? "#1E40AF" : "#6BB6FF" }}
            aria-hidden
          >
            <svg
              viewBox="0 0 1200 96"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full opacity-70"
              aria-hidden
            >
              <rect x="40" y="16" width="1120" height="64" fill="none" stroke="#fff" strokeWidth="1.6" />
              <line x1="600" y1="16" x2="600" y2="80" stroke="#fff" strokeWidth="1.6" />
              <line x1="40" y1="48" x2="1160" y2="48" stroke="#fff" strokeWidth="1.4" />
            </svg>
          </div>
          <div className="relative p-6 pt-16">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-caption text-white/90 drop-shadow">
                  Krok 2 z 2
                </div>
                <h1 className="text-h1 mt-1">{court.name}</h1>
                {court.description ? (
                  <p className="text-sm text-foreground-muted mt-1 max-w-2xl">
                    {court.description}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-1.5 pt-3">
                  <span className="pill inline-flex items-center gap-1.5 bg-surface-sunken px-2.5 py-1 text-xs font-medium text-foreground-muted">
                    {court.indoor ? (
                      <>
                        <Home className="size-3" /> Krytý
                      </>
                    ) : (
                      <>
                        <Sun className="size-3" /> Venkovní
                      </>
                    )}
                  </span>
                  <span className="pill inline-flex items-center gap-1.5 bg-surface-sunken px-2.5 py-1 text-xs font-medium text-foreground-muted">
                    <Layers className="size-3" />
                    {SURFACE_LABEL[court.surface]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sp.created ? (
        <div className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success-soft p-4 text-success">
          <CircleCheck className="size-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">Rezervace vytvořena</div>
            Najdeš ji v{" "}
            <Link href="/moje-rezervace" className="underline">
              Moje rezervace
            </Link>
            .
          </div>
        </div>
      ) : null}

      <ReservationPicker
        courtId={courtId}
        courtName={court.name}
        date={date}
        dateLabel={formatDateCZ(date)}
        dayName={DAY_NAMES[dow]}
        slots={pickerSlots}
        openingLabel={opening ? `${opening.startTime}–${opening.endTime}` : null}
        isOpen={isOpen}
        isAuthed={!!viewerId}
        loginHref={loginHref}
        weekStrip={weekStrip}
        prevDateHref={
          canGoPrev ? `/rezervace/${courtId}?date=${prevDate}` : null
        }
        nextDateHref={
          canGoNext ? `/rezervace/${courtId}?date=${nextDate}` : null
        }
        nextOpenDate={nextOpenDate}
      />
    </div>
  );
}
