import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Handles PKCE magic-link callbacks:
//   ?code=...  -> exchangeCodeForSession
//   ?token_hash=...&type=... -> verifyOtp
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const res = NextResponse.redirect(new URL("/", req.url));
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
  if (code) {
    await sb.auth.exchangeCodeForSession(code);
  } else if (
    token_hash &&
    (type === "email" ||
      type === "invite" ||
      type === "magiclink" ||
      type === "recovery" ||
      type === "signup")
  ) {
    await sb.auth.verifyOtp({ token_hash, type: type as "email" });
  }
  return res;
}
