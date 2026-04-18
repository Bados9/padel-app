import Link from "next/link";
import { LoginForm } from "@/app/(standalone)/login/login-form";

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function EmbedLoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  const cb = callbackUrl && callbackUrl.startsWith("/embed") ? callbackUrl : "/embed";

  return (
    <div className="mx-auto max-w-md px-4 py-6 space-y-4">
      <div>
        <h1 className="text-h2">Přihlášení</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Pro vytvoření rezervace se přihlas svým účtem.
        </p>
      </div>
      <LoginForm callbackUrl={cb} />
      <div className="text-sm text-foreground-muted">
        Ještě nemáš účet?{" "}
        <Link
          href={`/embed/register?callbackUrl=${encodeURIComponent(cb)}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          Zaregistruj se
        </Link>
      </div>
    </div>
  );
}
