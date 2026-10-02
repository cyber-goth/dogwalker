"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { todayInJerusalem } from "@/lib/dates";

export async function checkInToday() {
  const sb = await supabaseServer();
  const today = todayInJerusalem();
  const { error } = await sb.from("visits").insert({ visit_date: today });
  if (error && error.code !== "23505") throw new Error(error.message);
  revalidatePath("/");
}

export async function toggleDate(date: string, present: boolean) {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (data.user?.email !== process.env.OWNER_EMAIL)
    throw new Error("owner only");
  if (present) {
    const { error } = await sb.from("visits").delete().eq("visit_date", date);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await sb.from("visits").insert({ visit_date: date });
    if (error && error.code !== "23505") throw new Error(error.message);
  }
  revalidatePath("/");
}
