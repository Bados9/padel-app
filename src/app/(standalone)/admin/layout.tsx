import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const ADMIN_LINKS = [
  { href: "/admin", label: "Přehled" },
  { href: "/admin/kurty", label: "Kurty" },
  { href: "/admin/rezervace", label: "Rezervace" },
  { href: "/admin/uzivatele", label: "Uživatelé" },
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
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <nav className="flex flex-wrap items-center gap-1 border-b pb-2 text-sm">
        {ADMIN_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-md px-3 py-1.5 hover:bg-muted"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
