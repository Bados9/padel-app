import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Registrace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RegisterForm />
          <div className="text-sm text-muted-foreground">
            Už máš účet?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Přihlásit se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
