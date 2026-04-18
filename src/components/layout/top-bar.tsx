import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button, buttonVariants } from "@/components/ui/button";

export async function TopBar() {
  const session = await auth();

  return (
    <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight">
          <span className="text-emerald-600">●</span> Padel klub
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/rezervace" className="hover:underline">Rezervace</Link>
          <Link href="/hry" className="hover:underline">Otevřené hry</Link>
          {session?.user?.role === "ADMIN" ? (
            <Link href="/admin" className="hover:underline">Admin</Link>
          ) : null}

          {session?.user ? (
            <div className="flex items-center gap-2">
              <Link href="/profil" className="text-muted-foreground hover:underline">
                {session.user.name}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button variant="ghost" size="sm" type="submit">Odhlásit</Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Přihlásit
              </Link>
              <Link href="/register" className={buttonVariants({ size: "sm" })}>
                Registrace
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
