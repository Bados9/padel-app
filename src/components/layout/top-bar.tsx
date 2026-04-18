import Link from "next/link";
import { CircleDot, CalendarClock, Users, UserRound, Shield } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";

export async function TopBar() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:h-16 sm:py-0">
        <Link
          href="/"
          className="group flex items-center gap-2 font-semibold tracking-tight shrink-0"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30 transition-transform group-hover:-rotate-6">
            <CircleDot className="size-4" />
          </span>
          <span className="text-base">
            Padel
            <span className="text-foreground-muted">.klub</span>
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 text-sm flex-wrap">
          <NavPill href="/rezervace" icon={<CalendarClock className="size-3.5" />}>
            Rezervace
          </NavPill>
          <NavPill href="/hry" icon={<Users className="size-3.5" />}>
            Hry
          </NavPill>
          {session?.user ? (
            <NavPill href="/moje-rezervace">Moje</NavPill>
          ) : null}
          {isAdmin ? (
            <NavPill href="/admin" icon={<Shield className="size-3.5" />}>
              Admin
            </NavPill>
          ) : null}

          <div className="ml-1 flex items-center gap-1">
            {session?.user ? (
              <>
                <Link
                  href="/profil"
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-foreground-muted hover:bg-surface-sunken hover:text-foreground transition"
                >
                  <UserRound className="size-3.5" />
                  <span className="max-w-[120px] truncate">{session.user.name}</span>
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-md px-2.5 py-1.5 text-xs text-foreground-subtle hover:bg-surface-sunken hover:text-foreground transition"
                  >
                    Odhlásit
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground-muted hover:bg-surface-sunken hover:text-foreground transition"
                >
                  Přihlásit
                </Link>
                <Link
                  href="/register"
                  className={buttonVariants({ size: "sm" })}
                >
                  Registrace
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

function NavPill({
  href,
  children,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium text-foreground-muted hover:bg-surface-sunken hover:text-foreground transition"
    >
      {icon}
      {children}
    </Link>
  );
}
