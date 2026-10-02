// Simple shared-token auth for 2 people. No Supabase Auth.
// Cookie holds "role.hexmac" where hmac = HMAC-SHA256(role, SESSION_SECRET).
// Uses WebCrypto only so it runs in middleware, server actions, and tests.

export type Role = "owner" | "walker";
export const COOKIE = "dw_auth";

const enc = new TextEncoder();

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(role: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(role)));
}

// Constant-time string compare (lengths must already match).
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signRole(role: Role, secret: string): Promise<string> {
  return `${role}.${await hmacHex(role, secret)}`;
}

export async function verifySignedRole(
  value: string | undefined,
  secret: string
): Promise<Role | null> {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot < 0) return null;
  const role = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if ((role !== "owner" && role !== "walker") || !sig) return null;
  const expected = await hmacHex(role, secret);
  return safeEqual(sig, expected) ? role : null;
}
