import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySignedRole } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith("/login")) return NextResponse.next();
  const role = await verifySignedRole(
    req.cookies.get(COOKIE)?.value,
    process.env.SESSION_SECRET!
  );
  if (!role) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
