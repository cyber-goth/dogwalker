"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import HashSession from "@/components/HashSession";

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const error = useSearchParams().get("error");
  return (
    <main className="mx-auto max-w-sm p-6">
      <HashSession />
      <h1 className="text-xl font-bold">Dogwalker login</h1>
      {error && (
        <p className="mt-2 text-sm text-red-600">Login failed: {error}</p>
      )}
      {sent ? (
        <p>Check your email for the login link.</p>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const sb = supabaseBrowser();
            await sb.auth.signInWithOtp({
              email,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
              },
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
