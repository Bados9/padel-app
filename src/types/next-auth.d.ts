import type { DefaultSession } from "next-auth";
import type { UserRole, PlayerLevel } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      level: PlayerLevel;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    level: PlayerLevel;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    level: PlayerLevel;
  }
}
