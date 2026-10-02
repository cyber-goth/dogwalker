"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/actions";

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [token, setToken] = useState("");
  const error = useSearchParams().get("error");
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-bold">🐾 Dogwalker login</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Enter your access token (ask Victor for it).
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <form action={loginAction} className="mt-4 flex flex-col gap-2">
        <input
          type="password"
          name="token"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="access token"
          autoComplete="off"
          className="border p-2 rounded"
        />
        <button className="bg-black text-white p-2 rounded">Log in</button>
      </form>
    </main>
  );
}
