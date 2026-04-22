import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm, PasswordForm } from "@/components/profile/profile-forms";
import { ROLE_LABEL, LEVEL_LABEL } from "@/lib/labels";

export const metadata = { title: "Můj profil · Hraj:Padel" };

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profil");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: { select: { reservationsOwned: true, reservationGuests: true } },
    },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14 space-y-6">
      {/* Hero card */}
      <section className="relative overflow-hidden rounded-3xl court-grad p-6 sm:p-8 shadow-soft text-white">
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
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="grid size-20 place-items-center rounded-2xl bg-accent text-accent-foreground font-display text-3xl shadow-soft">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-white/85">
              08 — Profil
            </div>
            <h1 className="font-display text-4xl leading-none mt-1">
              {user.name ?? "Hráč"}
            </h1>
            <p className="mt-1.5 text-sm text-white/85">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="pill inline-flex items-center bg-white/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                {ROLE_LABEL[user.role]}
              </span>
              {user.level ? (
                <span className="pill inline-flex items-center bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">
                  {LEVEL_LABEL[user.level]}
                </span>
              ) : null}
              <span className="pill inline-flex items-center bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
                {user._count.reservationsOwned} rezervací
              </span>
              <span className="pill inline-flex items-center bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur">
                {user._count.reservationGuests} her jako host
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-surface-raised p-6 shadow-soft ring-1 ring-border space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Údaje</h2>
          <span className="text-caption">A — IDENTITA</span>
        </div>
        <ProfileForm defaultName={user.name} defaultLevel={user.level} />
      </section>

      <section className="rounded-3xl bg-surface-raised p-6 shadow-soft ring-1 ring-border space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Heslo</h2>
          <span className="text-caption">B — BEZPEČNOST</span>
        </div>
        <PasswordForm />
      </section>
    </div>
  );
}
