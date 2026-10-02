"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-bold">Dogwalker login</h1>
      {sent ? (
        <p>Check your email for the login link.</p>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const sb = supabaseBrowser();
            await sb.auth.signInWithOtp({
              email,
              options: { emailRedirectTo: window.location.origin },
            });
            setSent(true);
          }}
          className="mt-4 flex flex-col gap-2"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="border p-2 rounded"
          />
          <button className="bg-black text-white p-2 rounded">
            Send login link
          </button>
        </form>
      )}
    </main>
  );
}
