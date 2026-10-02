import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith("/login") || pathname.startsWith("/auth"))
    return NextResponse.next();
  const res = NextResponse.next();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { flowType: "pkce" },
      cookies: {
        get: (n: string) => req.cookies.get(n)?.value,
        set: (n: string, v: string, o: object) => {
          res.cookies.set(n, v, o as never);
        },
        remove: (n: string, o: object) => {
          res.cookies.set(n, "", o as never);
        },
      },
    }
  );
  const { data } = await sb.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/login", req.url));
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
