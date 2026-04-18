import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CourtForm } from "@/components/admin/court-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Admin – Editace kurtu" };

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCourtPage({ params }: PageProps) {
  const { id } = await params;
  const court = await db.court.findUnique({
    where: { id },
    include: {
      openingHours: { orderBy: { dayOfWeek: "asc" } },
      _count: { select: { reservations: true } },
    },
  });
  if (!court) notFound();

  const openings = Array.from({ length: 7 }).map((_, d) => {
    const row = court.openingHours.find((o) => o.dayOfWeek === d);
    if (row) {
      return {
        dayOfWeek: d,
        closed: false,
        startTime: row.startTime,
        endTime: row.endTime,
      };
    }
    return { dayOfWeek: d, closed: true, startTime: "08:00", endTime: "22:00" };
  });

  return (
    <div className="max-w-2xl space-y-4">
      <div className="space-y-1">
        <Link
          href="/admin/kurty"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Kurty
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Editace – {court.name}
        </h1>
      </div>

      <Card>
        <CardContent className="pt-4 text-xs text-muted-foreground">
          Celkem rezervací: {court._count.reservations}. Deaktivace zachovává
          historické rezervace, ale kurt se nezobrazuje ve veřejném katalogu.
        </CardContent>
      </Card>

      <CourtForm
        mode="edit"
        court={{
          id: court.id,
          name: court.name,
          description: court.description,
          surface: court.surface,
          indoor: court.indoor,
          active: court.active,
        }}
        openings={openings}
      />
    </div>
  );
}
