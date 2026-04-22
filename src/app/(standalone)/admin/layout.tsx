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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[11px] font-mono uppercase tracking-[0.08em] text-accent-foreground">
        <ShieldCheck className="size-3.5" />
        Admin mód
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-wrap gap-1 lg:flex-col lg:gap-1 text-sm rounded-3xl bg-surface-raised p-3 shadow-softer ring-1 ring-border h-fit">
          {ADMIN_LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-foreground-muted hover:bg-primary-soft hover:text-primary transition"
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
