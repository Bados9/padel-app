import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const LOGIN = `${basePath}/login`;

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth;
  const isAdmin = req.auth?.user?.role === "ADMIN";

  // Cesty v rámci "chráněné" zóny uživatele
  const userProtected =
    pathname.startsWith(`${basePath}/rezervace`) ||
    pathname.startsWith(`${basePath}/profil`) ||
    pathname.startsWith(`${basePath}/moje`);

  // Admin zóna
  const adminProtected = pathname.startsWith(`${basePath}/admin`);

  if ((userProtected || adminProtected) && !isAuthed) {
    const url = new URL(LOGIN, req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (adminProtected && !isAdmin) {
    return NextResponse.redirect(new URL(`${basePath}/`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|embed).*)",
  ],
};
