"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

// Catches implicit-flow tokens (dashboard invite links) that arrive as
// #access_token=...&refresh_token=... — the server never sees the hash,
// so this must run in the browser on the page the link lands on (/login).
export default function HashSession() {
  const router = useRouter();
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) return;
    const p = new URLSearchParams(hash.slice(1));
    const access_token = p.get("access_token");
    const refresh_token = p.get("refresh_token");
    if (!access_token || !refresh_token) return;
    supabaseBrowser()
      .auth.setSession({ access_token, refresh_token })
      .then(() => {
        window.history.replaceState(null, "", window.location.pathname);
        router.replace("/");
      });
  }, [router]);
  return null;
}
