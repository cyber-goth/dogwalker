"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { COOKIE, signRole, verifySignedRole, type Role } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { todayInJerusalem } from "@/lib/dates";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`auth not configured (missing ${name})`);
  return v;
}

async function role(): Promise<Role | null> {
  const store = await cookies();
  return verifySignedRole(store.get(COOKIE)?.value, process.env.SESSION_SECRET ?? "");
}

export async function loginAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  let role: Role | null = null;
  if (token && token === env("OWNER_TOKEN")) role = "owner";
  else if (token && token === env("WALKER_TOKEN")) role = "walker";
  if (!role) redirect("/login?error=wrong+token%2C+try+again");
  const store = await cookies();
  store.set(COOKIE, await signRole(role, env("SESSION_SECRET")), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 31536000,
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/");
}

export async function logoutAction() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}

export async function checkInToday() {
  if (!(await role())) throw new Error("not logged in");
  const sb = supabaseAdmin();
  const { error } = await sb.from("visits").insert({ visit_date: todayInJerusalem() });
  if (error && error.code !== "23505") throw new Error(error.message);
  revalidatePath("/");
}

export async function toggleDate(date: string, present: boolean) {
  if ((await role()) !== "owner") throw new Error("owner only");
  const sb = supabaseAdmin();
  if (present) {
    const { error } = await sb.from("visits").delete().eq("visit_date", date);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from("visits").insert({ visit_date: date });
    if (error && error.code !== "23505") throw new Error(error.message);
  }
  revalidatePath("/");
}
