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
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Padel klub · prototyp · {new Date().getFullYear()}
      </footer>
      <Toaster richColors closeButton />
    </div>
  );
}
