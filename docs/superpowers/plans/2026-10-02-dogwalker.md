# Dogwalker Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a private $0 Next.js + Supabase app where the walker checks in daily and the owner sees a calendar + monthly count/list.

**Architecture:** Single Next.js App Router app; Server Components read via Supabase; Server Actions write; one `visits` table with RLS (walker add-today-only, owner add+delete).

**Tech Stack:** Next.js 14+ (App Router, TS), Tailwind, `@supabase/supabase-js` + `@supabase/ssr`, Supabase Postgres + Auth (magic-link), Vercel Hobby.

**Spec:** `docs/superpowers/specs/2026-10-02-dogwalker-design.md`

## Global Constraints

- Timezone for all "today"/month logic is `Asia/Jerusalem` — never use server-local date.
- No public signup — Supabase Auth invites only (2 users).
- `visit_date` UNIQUE — double check-in is success, never an error to the user.
- Walker can only INSERT today; only owner (`OWNER_EMAIL`) can DELETE or touch other days.
- Service-role key never in client code.
- YAGNI: no payments, no export, no photos/notes, no multi-dog.

---

### Task 1: Git remote + Next.js scaffold + Supabase deps

**Files:**
- Modify: git remotes (add origin)
- Create: Next.js app files (`package.json`, `app/layout.tsx`, `app/page.tsx`, etc. via scaffolder)
- Modify: `package.json` (add `@supabase/supabase-js`, `@supabase/ssr`)
- Create: `.env.example`
- Create: `docs/superpowers/specs/2026-10-02-dogwalker-design.md` (done), this plan file (done)

**Interfaces:**
- Consumes: empty repo on `main`, remote `https://github.com/cyber-goth/dogwalker.git`
- Produces: runnable `npm run dev`, `next`, `react`, supabase libs installed

- [ ] **Step 1: Add git remote and verify**

```bash
git remote add origin https://github.com/cyber-goth/dogwalker.git
git remote -v
```
Expected: `origin` fetch+push point at cyber-goth/dogwalker.

- [ ] **Step 2: Scaffold Next.js (TypeScript + Tailwind + App Router, no src dir, no Turbopack choice blocking)**

Run: `npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm`
Expected: exits 0; `app/layout.tsx`, `app/page.tsx`, `package.json` exist. Answer prompts: no to `src/` dir is fine either way; keep defaults lean.

- [ ] **Step 3: Install Supabase libs**

Run: `npm i @supabase/supabase-js @supabase/ssr`
Expected: `package.json` lists both.

- [ ] **Step 4: Write `.env.example` (no secrets)**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
OWNER_EMAIL=owner@example.com
```

- [ ] **Step 5: Smoke test**

Run: `npm run build`
Expected: PASS (default starter builds).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold next.js + supabase deps"
```

### Task 2: Date helpers + unit tests (Asia/Jerusalem core)

**Files:**
- Create: `lib/dates.ts`
- Create: `lib/dates.test.ts`
- Modify: `package.json` (add `vitest` dev dep + `test` script)

**Interfaces:**
- Consumes: nothing
- Produces: `todayInJerusalem(d?: Date): string` (YYYY-MM-DD), `monthGrid(year, month): (string|null)[][]`, `formatSummary(year, month, dates: string[]): string`

- [ ] **Step 1: Install vitest**

Run: `npm i -D vitest`
Expected: devDependency added. Add script `"test": "vitest run"`.

- [ ] **Step 2: Write failing test `lib/dates.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { todayInJerusalem, monthGrid, formatSummary } from "./dates";

describe("dates", () => {
  it("todayInJerusalem maps 2026-10-01T21:30:00Z to 2026-10-02 (IDT UTC+3)", () => {
    expect(todayInJerusalem(new Date("2026-10-01T21:30:00Z"))).toBe("2026-10-02");
  });
  it("monthGrid starts Oct 2026 on Thursday (Mon-first, null pads)", () => {
    const g = monthGrid(2026, 10);
    expect(g[0].slice(0, 3)).toEqual([null, null, null]);
    expect(g[0][3]).toBe("2026-10-01");
  });
  it("formatSummary counts and lists days", () => {
    expect(formatSummary(2026, 10, ["2026-10-01", "2026-10-03"])).toBe(
      "October 2026: 2 visits — 1, 3"
    );
  });
});
```

- [ ] **Step 3: Run test, verify FAIL**

Run: `npm test`
Expected: FAIL with "Cannot find module './dates'".

- [ ] **Step 4: Minimal implementation `lib/dates.ts`**

```ts
const TZ = "Asia/Jerusalem";

export function todayInJerusalem(d = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
  return parts; // YYYY-MM-DD
}

export function monthGrid(year: number, month: number): (string | null)[][] {
  // month 1-12, weeks Mon-first
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const cells: (string | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(`${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function formatSummary(year: number, month: number, dates: string[]): string {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  const days = dates.filter((d) => d.startsWith(prefix)).map((d) => Number(d.slice(8))).sort((a, b) => a - b);
  return `${MONTHS[month - 1]} ${year}: ${days.length} visit${days.length === 1 ? "" : "s"}${days.length ? " — " + days.join(", ") : ""}`;
}
```

- [ ] **Step 5: Run test, verify PASS**

Run: `npm test`
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add lib/dates.ts lib/dates.test.ts package.json package-lock.json
git commit -m "feat: jerusalem date helpers with tests"
```

### Task 3: Supabase wiring (clients, middleware, SQL migration)

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`
- Create: `supabase/migrations/0001_visits.sql`
- Create: `app/login/page.tsx`

**Interfaces:**
- Consumes: `lib/dates.ts` (`todayInJerusalem`), env vars
- Produces: browser + server Supabase clients, auth-guarded routes, `visits` table + RLS SQL ready to paste into Supabase dashboard

- [ ] **Step 1: Write `lib/supabase/client.ts`**

```ts
"use client";
import { createBrowserClient } from "@supabase/ssr";

export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Write `lib/supabase/server.ts`**

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export function supabaseServer() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n: string) => store.get(n)?.value } }
  );
}
```

- [ ] **Step 3: Write `middleware.ts` (guard everything except /login)**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/login")) return NextResponse.next();
  const res = NextResponse.next();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n: string) => req.cookies.get(n)?.value,
        set: (n: string, v: string, o: object) => { res.cookies.set(n, v, o as never); },
        remove: (n: string, o: object) => { res.cookies.set(n, "", o as never); },
      },
    }
  );
  const { data } = await sb.auth.getUser();
  if (!data.user) return NextResponse.redirect(new URL("/login", req.url));
  return res;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
```

- [ ] **Step 4: Write `supabase/migrations/0001_visits.sql`**

```sql
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  visit_date date unique not null,
  created_by uuid references auth.users,
  created_at timestamptz default now()
);
alter table public.visits enable row level security;

create or replace function public.is_owner() returns boolean
language sql stable as $$ select auth.jwt() ->> 'email' = current_setting('app.owner_email', true) $$;

drop policy if exists "read for authenticated" on public.visits;
create policy "read for authenticated" on public.visits
  for select to authenticated using (true);

drop policy if exists "insert today for authenticated" on public.visits;
create policy "insert today for authenticated" on public.visits
  for insert to authenticated
  with check (visit_date = (now() at time zone 'Asia/Jerusalem')::date);

drop policy if exists "delete owner only" on public.visits;
create policy "delete owner only" on public.visits
  for delete to authenticated using (public.is_owner());
```

Note: set `app.owner_email` via a `set_config` trigger or replace `is_owner()` body
with a direct email comparison to OWNER_EMAIL after first deploy — simplest is to
edit the function in the dashboard to `... = 'owner@example.com'`.

- [ ] **Step 5: Write `app/login/page.tsx` (magic-link)**

```tsx
"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-xl font-bold">Dogwalker login</h1>
      {sent ? <p>Check your email for the login link.</p> : (
        <form onSubmit={async (e) => {
          e.preventDefault();
          const sb = supabaseBrowser();
          await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
          setSent(true);
        }} className="mt-4 flex flex-col gap-2">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" className="border p-2 rounded" />
          <button className="bg-black text-white p-2 rounded">Send login link</button>
        </form>
      )}
    </main>
  );
}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/supabase middleware.ts supabase app/login
git commit -m "feat: supabase auth wiring + visits migration"
```

### Task 4: Calendar + check-in + monthly summary UI with Server Actions

**Files:**
- Create: `app/actions.ts`
- Create: `components/Calendar.tsx`
- Modify: `app/page.tsx`
- Modify: `app/layout.tsx` (title)

**Interfaces:**
- Consumes: `supabaseServer()`, `todayInJerusalem`, `monthGrid`, `formatSummary`, `OWNER_EMAIL`
- Produces: `/` shows calendar, summary header, check-in button; owner toggle works

- [ ] **Step 1: Write `app/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { todayInJerusalem } from "@/lib/dates";

export async function checkInToday() {
  const sb = supabaseServer();
  const today = todayInJerusalem();
  const { error } = await sb.from("visits").insert({ visit_date: today });
  if (error && error.code !== "23505") throw new Error(error.message);
  revalidatePath("/");
}

export async function toggleDate(date: string, present: boolean) {
  const sb = supabaseServer();
  const { data } = await sb.auth.getUser();
  if (data.user?.email !== process.env.OWNER_EMAIL) throw new Error("owner only");
  if (present) await sb.from("visits").delete().eq("visit_date", date);
  else {
    const { error } = await sb.from("visits").insert({ visit_date: date });
    if (error && error.code !== "23505") throw new Error(error.message);
  }
  revalidatePath("/");
}
```

- [ ] **Step 2: Write `components/Calendar.tsx` (client, props: weeks, visited Set, today, isOwner)**

Props: `{ weeks: (string|null)[][], visited: string[], today: string, isOwner: boolean }`.
Renders grid Mon-first, green cells for visited, disables future (`date > today`),
owner taps call `toggleDate`, big check-in button calls `checkInToday` and disables
when `visited.includes(today)`. Keep under ~120 lines.

- [ ] **Step 3: Rewrite `app/page.tsx` (server)**

Read `year`/`month` searchParams (default = current Jerusalem month), fetch
`visits` for that month via `supabaseServer()`, compute summary via
`formatSummary`, render header + `<Calendar/>`. Redirect to login handled by middleware.

- [ ] **Step 4: Update `app/layout.tsx` title to "Dogwalker"**

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app components
git commit -m "feat: calendar + check-in + monthly summary"
```

### Task 5: Push, deploy, verify

**Files:**
- Modify: Vercel project env (dashboard, manual)
- Modify: Supabase project (dashboard SQL paste, disable signups, invite 2 users)

**Interfaces:**
- Consumes: all prior tasks
- Produces: live URL, RLS matrix verified

- [ ] **Step 1: Push to GitHub**

```bash
git push -u origin main
```
Expected: repo populated on GitHub.

- [ ] **Step 2: Supabase dashboard (manual, paste SQL from Task 3)**

Create project → SQL editor → paste `supabase/migrations/0001_visits.sql` (with owner
email inlined) → Auth → disable signups → invite owner + walker emails.

- [ ] **Step 3: Vercel import (manual)**

Import `cyber-goth/dogwalker` → set env `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OWNER_EMAIL` → deploy.

- [ ] **Step 4: RLS matrix (against live or local)**

Anon SELECT denied; walker insert-today ok; walker delete denied; future insert
denied; owner delete ok; double check-in stays one row.

- [ ] **Step 5: Final build + test**

Run: `npm run build && npm test`
Expected: both PASS.
