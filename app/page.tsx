import Link from "next/link";
import { cookies } from "next/headers";
import { COOKIE, verifySignedRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logoutAction } from "@/app/actions";
import { todayInJerusalem, monthGrid, formatSummary } from "@/lib/dates";
import Calendar from "@/components/Calendar";

type SP = { year?: string; month?: string };

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const now = todayInJerusalem();
  const year = Number(sp.year ?? now.slice(0, 4));
  const month = Number(sp.month ?? now.slice(5, 7));

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const sb = supabaseAdmin();
  const { data: visits } = await sb
    .from("visits")
    .select("visit_date")
    .gte("visit_date", from)
    .lte("visit_date", to);
  const dates = (visits ?? []).map((v) => v.visit_date as string);
  const role = await verifySignedRole(
    (await cookies()).get(COOKIE)?.value,
    process.env.SESSION_SECRET ?? ""
  );
  const isOwner = role === "owner";

  return (
    <main className="mx-auto max-w-sm p-4 pb-10">
      <div className="flex items-center justify-between mb-2">
        <Link
          href={`/?year=${prev.y}&month=${prev.m}`}
          className="p-2 text-xl"
          aria-label="Previous month"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold">🐾 Dogwalker</h1>
        <Link
          href={`/?year=${next.y}&month=${next.m}`}
          className="p-2 text-xl"
          aria-label="Next month"
        >
          →
        </Link>
      </div>
      <p className="mb-3 font-medium">{formatSummary(year, month, dates)}</p>
      <Calendar
        weeks={monthGrid(year, month)}
        visited={dates}
        today={now}
        isOwner={isOwner}
      />
      <form action={logoutAction} className="mt-6 text-center">
        <button className="text-xs text-zinc-400 underline">Sign out</button>
      </form>
    </main>
  );
}
