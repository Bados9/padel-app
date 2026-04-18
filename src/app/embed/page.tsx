export default function EmbedIndex() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-xl text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
          <span className="size-2 rounded-full bg-emerald-500" />
          Embed shell – M1
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Rezervace padelu (embed)
        </h1>
        <p className="text-sm text-muted-foreground">
          Toto je odlehčený layout pro použití v iframu – bez topbaru a footeru. Hlavní funkcionalita přibude v M2.
        </p>
      </div>
    </div>
  );
}
