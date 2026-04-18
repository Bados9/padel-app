import { Toaster } from "@/components/ui/sonner";

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[200px] bg-background">
      {children}
      <Toaster richColors closeButton position="top-center" />
    </div>
  );
}
