import Link from "next/link";
import { LoginForm } from "./login-form";
import { Wordmark } from "@/components/layout/logo";

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="mx-auto grid max-w-5xl px-4 py-10 sm:py-16 gap-8 md:grid-cols-2 md:items-center">
      {/* Left: brand / illustration */}
      <div className="relative hidden md:block">
        <div className="relative overflow-hidden rounded-3xl court-grad p-10 text-white shadow-soft min-h-[420px]">
          <svg
            viewBox="0 0 500 420"
            preserveAspectRatio="none"
            aria-hidden
            className="absolute inset-0 h-full w-full opacity-60"
          >
            <rect x="40" y="40" width="420" height="340" fill="none" stroke="#fff" strokeWidth="3" />
            <line x1="250" y1="40" x2="250" y2="380" stroke="#fff" strokeWidth="3" />
            <line x1="40" y1="210" x2="460" y2="210" stroke="#fff" strokeWidth="2.5" />
            <line x1="120" y1="40" x2="120" y2="380" stroke="#fff" strokeWidth="2" />
            <line x1="380" y1="40" x2="380" y2="380" stroke="#fff" strokeWidth="2" />
          </svg>
          <div className="relative flex h-full flex-col justify-between">
            <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-white/85">
              Vítej zpátky
            </div>
            <div>
              <Wordmark className="text-5xl" colon="accent" />
              <p className="mt-4 max-w-[300px] text-sm text-white/85">
                Přihlas se a rezervuj si kurt v pár klepnutích.
              </p>
            </div>
          </div>
          <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden className="absolute -bottom-4 -right-4">
            <circle cx="60" cy="60" r="54" fill="#D4ED4C" />
            <path d="M14 48 C30 84, 90 36, 106 72" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Right: form card */}
      <div className="rounded-3xl bg-surface-raised p-6 sm:p-8 shadow-soft ring-1 ring-border space-y-5">
        <div>
          <div className="text-caption">Přihlášení</div>
          <h1 className="font-display text-3xl mt-1">Vítej zpátky</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Zadej e-mail a heslo, kterými ses registroval/a.
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl ?? "/"} />
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>Nemáš účet?</span>
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline"
          >
            Zaregistruj se →
          </Link>
        </div>
        <div className="rounded-2xl bg-accent-soft p-3 text-xs text-accent-foreground">
          <div className="font-mono uppercase tracking-wider text-[10px] opacity-70">
            Testovací účet
          </div>
          <div className="mt-0.5 tnum">hrac@padel.local · hrac123</div>
        </div>
      </div>
    </div>
  );
}
