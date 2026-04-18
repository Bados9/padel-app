import { Toaster } from "@/components/ui/sonner";
import { IframeAutoresize } from "@/components/embed/iframe-autoresize";

export const dynamic = "force-dynamic";

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[200px] bg-background">
      <IframeAutoresize />
      {children}
      <Toaster richColors closeButton position="top-center" />
    </div>
  );
}
