import Link from "next/link";
import { cookies } from "next/headers";
import { COOKIE, verifySignedRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logoutAction } from "@/app/actions";
import { todayInJerusalem, monthGrid } from "@/lib/dates";
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
  const mm = String(month).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${mm}-${String(lastDay).padStart(2, "0")}`;

  const sb = supabaseAdmin();
  const { data: visits } = await sb
    .from("visits")
    .select("visit_date")
    .gte("visit_date", `${year}-${mm}-01`)
    .lte("visit_date", to);
  const dates = (visits ?? []).map((v) => v.visit_date as string);
  const days = dates
    .map((d) => Number(d.slice(8)))
    .sort((a, b) => a - b);
  const monthName = new Date(Date.UTC(year, month - 1, 1)).toLocaleString(
    "en",
    { month: "long" }
  );
  const role = await verifySignedRole(
    (await cookies()).get(COOKIE)?.value,
    process.env.SESSION_SECRET ?? ""
  );
  const isOwner = role === "owner";

  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-10 space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/?year=${prev.y}&month=${prev.m}`}
          aria-label="Previous month"
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white shadow-md shadow-orange-900/10 text-xl text-cocoa-800 active:scale-95 transition"
        >
          ←
        </Link>
        <div className="text-center">
          <div className="text-3xl">🐾</div>
          <h1 className="text-xl font-extrabold text-cocoa-950 leading-tight">
            {monthName} {year}
          </h1>
        </div>
        <Link
          href={`/?year=${next.y}&month=${next.m}`}
          aria-label="Next month"
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white shadow-md shadow-orange-900/10 text-xl text-cocoa-800 active:scale-95 transition"
        >
          →
        </Link>
      </div>

      <section className="bg-cocoa-950 text-white rounded-3xl shadow-lg p-5 text-center">
        <div className="text-5xl font-extrabold">{dates.length}</div>
        <div className="text-sm opacity-80">
          walk{dates.length === 1 ? "" : "s"} in {monthName}
        </div>
        {days.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {days.map((d) => (
              <span
                key={d}
                className="min-w-7 px-1.5 py-0.5 rounded-full bg-white/15 text-xs font-bold"
              >
                {d}
              </span>
            ))}
          </div>
        )}
      </section>

      <Calendar
        weeks={monthGrid(year, month)}
        visited={dates}
        today={now}
        isOwner={isOwner}
      />

      <form action={logoutAction} className="text-center">
        <button className="text-xs text-cocoa-500 underline">Sign out</button>
      </form>
    </main>
  );
}
