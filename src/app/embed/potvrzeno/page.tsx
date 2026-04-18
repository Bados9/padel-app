import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { formatDateCZ, formatTimeCZ } from "@/lib/time";

type Props = {
  searchParams: Promise<{ courtId?: string }>;
};

export default async function EmbedConfirmedPage({ searchParams }: Props) {
  const sp = await searchParams;
  const session = await auth();

  // Zkus ukázat poslední rezervaci hráče na daném kurtu (pro souhrn)
  let lastReservation = null as
    | null
    | {
        startAt: Date;
        endAt: Date;
        court: { id: string; name: string };
      };
  if (session?.user?.id && sp.courtId) {
    lastReservation = await db.reservation.findFirst({
      where: {
        ownerId: session.user.id,
        courtId: sp.courtId,
        status: "CONFIRMED",
        endAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      include: { court: { select: { id: true, name: true } } },
    });
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 space-y-5 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-success-soft text-success">
        <CircleCheck className="size-7" />
      </div>

      <div>
        <h1 className="text-h1">Rezervace potvrzena</h1>
        <p className="text-sm text-foreground-muted mt-2">
          Tvůj termín je zapsaný. Na místě ti stačí ukázat jméno na recepci.
        </p>
      </div>

      {lastReservation ? (
        <div className="rounded-2xl border border-border bg-surface-raised p-5 text-left space-y-1">
          <div className="text-caption">Detail</div>
          <div className="font-semibold">{lastReservation.court.name}</div>
          <p className="text-sm text-foreground-muted tnum">
            {formatDateCZ(lastReservation.startAt)} ·{" "}
            {formatTimeCZ(lastReservation.startAt)}–
            {formatTimeCZ(lastReservation.endAt)}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <Link
          href="/embed"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-4 py-2 text-sm font-medium hover:bg-surface-sunken transition"
        >
          Rezervovat další termín
        </Link>
      </div>
    </div>
  );
}
