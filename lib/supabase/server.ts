import { createClient } from "@supabase/supabase-js";

// Server-only admin client (service-role key bypasses RLS).
// Never import this from a client component. Role checks live in app/actions.ts.
export function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
