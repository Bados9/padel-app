import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  CalendarRange,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";

const ADMIN_LINKS = [
  { href: "/admin", label: "Přehled", icon: LayoutDashboard },
  { href: "/admin/kurty", label: "Kurty", icon: Building2 },
  { href: "/admin/rezervace", label: "Rezervace", icon: CalendarRange },
  { href: "/admin/uzivatele", label: "Uživatelé", icon: Users },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning-soft px-3 py-1 text-caption text-warning">
        <ShieldCheck className="size-3.5" />
        Admin mód
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav className="flex flex-wrap gap-1 lg:flex-col lg:gap-0.5 text-sm">
          {ADMIN_LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-foreground-muted hover:bg-surface-sunken hover:text-foreground transition"
              >
                <Icon className="size-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
