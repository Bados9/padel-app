import Link from "next/link";

export const metadata = {
  title: "Embed dokumentace · Padel klub",
};

const EMBED_URL = "https://your-domain.example/padel/embed";

export default function EmbedDocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Vložení rezervace na web klubu
        </h1>
        <p className="text-sm text-muted-foreground">
          Zkopíruj snippet níž na libovolnou stránku klubu. iframe se
          automaticky přizpůsobí výšce obsahu přes <code>postMessage</code>.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. Vlož iframe</h2>
        <pre className="rounded-md border bg-muted/50 p-3 text-xs overflow-auto">
{`<iframe
  id="padel-iframe"
  src="${EMBED_URL}"
  style="width:100%; border:0; min-height:400px;"
  title="Rezervace padelu"
></iframe>`}
        </pre>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. Přidej auto-resize</h2>
        <pre className="rounded-md border bg-muted/50 p-3 text-xs overflow-auto">
{`<script>
  window.addEventListener("message", (e) => {
    if (!e.data || e.data.type !== "padel-resize") return;
    const el = document.getElementById("padel-iframe");
    if (el && typeof e.data.height === "number") {
      el.style.height = e.data.height + "px";
    }
  });
</script>`}
        </pre>
        <p className="text-xs text-muted-foreground">
          Formát zprávy: <code>{"{ type: \"padel-resize\", height: <number>, path: <string> }"}</code>
        </p>
      </section>

      <section className="space-y-2 text-sm text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">Poznámky</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Rezervace (kliknutí na „Rezervovat“) otevře kurt v hlavním okně (<code>target=_top</code>) – uživatel tam dokončí přihlášení a potvrdí slot.</li>
          <li>V prototypu povolujeme framing odkudkoliv (<code>Content-Security-Policy: frame-ancestors *</code>). V produkci plánujeme whitelist přes <code>IFRAME_ALLOWED_ORIGINS</code>.</li>
          <li>Cookies Auth.js jsou v prod nastavené jako <code>SameSite=None; Secure</code>, takže přihlášení v iframu funguje přes HTTPS.</li>
        </ul>
      </section>

      <p className="text-xs">
        <Link href="/embed" className="underline">
          Živá ukázka /embed →
        </Link>
      </p>
    </div>
  );
}
