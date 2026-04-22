import { TopBar } from "@/components/layout/top-bar";
import { Toaster } from "@/components/ui/sonner";

export const dynamic = "force-dynamic";

export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-6 text-center text-[11px] font-mono uppercase tracking-[0.08em] text-foreground-subtle">
        HRAJ:PADEL · PROTOTYP · {new Date().getFullYear()}
      </footer>
      <Toaster richColors closeButton />
    </div>
  );
}
