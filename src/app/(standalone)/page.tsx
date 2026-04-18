import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="relative min-h-[calc(100vh-theme(spacing.14)-theme(spacing.16))]">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />

      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24 text-center space-y-6">
        <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Rezervace · matchmaking · admin
        </Badge>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Padel, kdykoliv a s kýmkoliv
        </h1>
        <p className="mx-auto max-w-xl text-lg text-muted-foreground">
          Rezervuj si kurt, nebo se přidej k otevřené hře a najdi si spoluhráče podle úrovně.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/rezervace" className={buttonVariants({ size: "lg" })}>
            Rezervovat kurt
          </Link>
          <Link href="/hry" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Prohlédnout otevřené hry
          </Link>
        </div>

        {!session ? (
          <p className="text-sm text-muted-foreground pt-4">
            Testovací účet: <code className="px-1 py-0.5 rounded bg-muted text-foreground">hrac@padel.local / hrac123</code>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground pt-4">
            Přihlášen jako <strong>{session.user?.name}</strong> · level {session.user?.level}
          </p>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Rezervace",
            desc: "Vyber si kurt, den a čas. Rezervace na pár kliknutí.",
            status: "hotovo",
          },
          {
            title: "Matchmaking",
            desc: "Není vás dost? Označ rezervaci jako otevřenou a najde se partie.",
            status: "hotovo",
          },
          {
            title: "Admin klubu",
            desc: "Správa kurtů, uživatelů a rezervací v jednom přehledu.",
            status: "hotovo",
          },
        ].map((f) => (
          <Card key={f.title}>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{f.title}</h3>
                <Badge variant="secondary" className="text-xs">{f.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
