import Link from "next/link";
import { CourtForm } from "@/components/admin/court-form";

export const metadata = { title: "Admin – Nový kurt" };

export default function NewCourtPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="space-y-1">
        <Link
          href="/admin/kurty"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Kurty
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Nový kurt</h1>
      </div>
      <CourtForm mode="create" />
    </div>
  );
}
