import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Přihlášení</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm callbackUrl={callbackUrl ?? "/"} />
          <div className="text-sm text-muted-foreground">
            Ještě nemáš účet?{" "}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              Zaregistruj se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
