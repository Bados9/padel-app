import { db } from "@/lib/db";
import { AdminUserRow } from "@/components/admin/user-row";

export const metadata = { title: "Admin – Uživatelé" };

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { reservationsOwned: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Uživatelé</h1>
      <p className="text-xs text-muted-foreground">
        Celkem {users.length}. Změna role/levelu se projeví po příštím přihlášení uživatele.
      </p>
      <div className="space-y-2">
        {users.map((u) => (
          <AdminUserRow
            key={u.id}
            user={{
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.role,
              level: u.level,
              createdAt: u.createdAt,
            }}
            reservationsCount={u._count.reservationsOwned}
          />
        ))}
      </div>
    </div>
  );
}
