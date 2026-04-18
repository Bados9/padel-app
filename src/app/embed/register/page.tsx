import Link from "next/link";
import { RegisterForm } from "@/app/(standalone)/register/register-form";

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function EmbedRegisterPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  const cb = callbackUrl && callbackUrl.startsWith("/embed") ? callbackUrl : "/embed";

  return (
    <div className="mx-auto max-w-md px-4 py-6 space-y-4">
      <div>
        <h1 className="text-h2">Registrace</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Založíme ti účet – pak už jen potvrdíš termín.
        </p>
      </div>
      <RegisterForm callbackUrl={cb} />
      <div className="text-sm text-foreground-muted">
        Už máš účet?{" "}
        <Link
          href={`/embed/login?callbackUrl=${encodeURIComponent(cb)}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          Přihlásit se
        </Link>
      </div>
    </div>
  );
}
