export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-slate-50 dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          M0 – Bootstrap OK
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Padel rezervační systém
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Prototyp běží. Další milník: databáze, autentizace a doménový model.
        </p>
        <div className="pt-4 text-sm text-slate-500 dark:text-slate-500">
          Next.js 15 · TypeScript · Tailwind CSS · Docker
        </div>
      </div>
    </main>
  );
}
