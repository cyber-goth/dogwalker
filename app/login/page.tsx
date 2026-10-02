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
    <main className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl shadow-orange-900/10 p-8 text-center">
        <div className="text-6xl">🐶</div>
        <h1 className="mt-2 text-2xl font-extrabold text-cocoa-950">
          Dogwalker
        </h1>
        <p className="mt-1 text-sm text-cocoa-500">
          Enter your access token to see when the walker came.
        </p>
        {error && (
          <p className="mt-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
        <form action={loginAction} className="mt-5 flex flex-col gap-3">
          <input
            type="password"
            name="token"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Access token"
            autoComplete="off"
            className="border-2 border-orange-100 focus:border-honey-500 outline-none p-3 rounded-2xl text-center"
          />
          <button className="bg-cocoa-950 text-white font-bold p-3 rounded-2xl active:scale-[0.98] transition">
            Log in 🐾
          </button>
        </form>
      </div>
    </main>
  );
}
