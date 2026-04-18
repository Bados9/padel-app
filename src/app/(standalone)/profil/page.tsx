import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm, PasswordForm } from "@/components/profile/profile-forms";

export const metadata = { title: "Můj profil · Padel klub" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profil");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { _count: { select: { reservationsOwned: true, reservationGuests: true } } },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Můj profil</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{user.email}</span>
          <Badge variant="outline" className="text-xs">
            {user.role}
          </Badge>
          <span>· {user._count.reservationsOwned} rezervací · {user._count.reservationGuests} her jako host</span>
        </div>
      </header>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <h2 className="text-lg font-semibold">Údaje</h2>
          <ProfileForm defaultName={user.name} defaultLevel={user.level} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-4">
          <h2 className="text-lg font-semibold">Heslo</h2>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
