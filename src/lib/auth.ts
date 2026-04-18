import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import type { UserRole, PlayerLevel } from "@prisma/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const isProd = process.env.NODE_ENV === "production";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  // Auth.js basePath pro API routes – musí následovat app basePath
  basePath: `${basePath}/api/auth`,
  trustHost: true,
  // Iframe-friendly cookies: v prod SameSite=None+Secure, v dev Lax (http://localhost)
  cookies: isProd
    ? {
        sessionToken: {
          name: "__Secure-authjs.session-token",
          options: {
            httpOnly: true,
            sameSite: "none",
            path: "/",
            secure: true,
          },
        },
        callbackUrl: {
          name: "__Secure-authjs.callback-url",
          options: {
            httpOnly: true,
            sameSite: "none",
            path: "/",
            secure: true,
          },
        },
        csrfToken: {
          name: "__Host-authjs.csrf-token",
          options: {
            httpOnly: true,
            sameSite: "none",
            path: "/",
            secure: true,
          },
        },
      }
    : undefined,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Heslo", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          level: user.level,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as UserRole;
        token.level = user.level as PlayerLevel;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.level = token.level as PlayerLevel;
      }
      return session;
    },
  },
});
