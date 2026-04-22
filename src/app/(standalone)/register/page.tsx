import Link from "next/link";
import { RegisterForm } from "./register-form";
import { Wordmark } from "@/components/layout/logo";

export default function RegisterPage() {
  return (
    <div className="mx-auto grid max-w-5xl px-4 py-10 sm:py-16 gap-8 md:grid-cols-2 md:items-center">
      {/* Left: brand */}
      <div className="relative hidden md:block">
        <div className="relative overflow-hidden rounded-3xl bg-accent p-10 text-accent-foreground shadow-soft min-h-[420px]">
          <svg
            viewBox="0 0 500 420"
            preserveAspectRatio="none"
            aria-hidden
            className="absolute inset-0 h-full w-full opacity-40"
          >
            <rect x="40" y="40" width="420" height="340" fill="none" stroke="#1E40AF" strokeWidth="3" />
            <line x1="250" y1="40" x2="250" y2="380" stroke="#1E40AF" strokeWidth="3" />
            <line x1="40" y1="210" x2="460" y2="210" stroke="#1E40AF" strokeWidth="2.5" />
          </svg>
          <div className="relative flex h-full flex-col justify-between">
            <div className="text-[11px] font-mono uppercase tracking-[0.08em] opacity-70">
              Nový hráč
            </div>
            <div>
              <Wordmark className="text-5xl" colon="primary" />
              <p className="mt-4 max-w-[320px] text-sm opacity-80">
                Účet ti dá přístup k rezervacím a otevřeným hrám.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="rounded-3xl bg-surface-raised p-6 sm:p-8 shadow-soft ring-1 ring-border space-y-5">
        <div>
          <div className="text-caption">Registrace</div>
          <h1 className="font-display text-3xl mt-1">Vytvoř si účet</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Chvilka a můžeš rezervovat první kurt.
          </p>
        </div>
        <RegisterForm />
        <div className="flex items-center justify-between text-sm text-foreground-muted">
          <span>Už máš účet?</span>
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Přihlásit se →
          </Link>
        </div>
      </div>
    </div>
  );
}
