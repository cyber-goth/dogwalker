# Dogwalker Tracker — Design Spec

**Date:** 2026-10-02
**Status:** Approved (owner + walker flow, Asia/Jerusalem, Next.js + Supabase)
**Scope:** 1 dog, 1 walker, private use only. Count + list monthly summary.

## Goal
A tiny secure private webapp to see on which days the dogwalker came,
with a walker self check-in and a month summary (count + date list). $0 hosting.

## Architecture
Single Next.js App Router app on Vercel (free Hobby) + Supabase Postgres
(free tier) + Supabase Auth. No custom backend. Server Components for
reads, Server Actions / Route Handlers for writes. One table, RLS enforced.

## Data model
`visits(id uuid pk default gen_random_uuid(), visit_date date unique not null, created_by uuid references auth.users, created_at timestamptz default now())`
- One row = walker came that day. `UNIQUE(visit_date)` makes check-in idempotent.

## Auth & permissions (v2: shared-token, no Supabase Auth)
- Two long random tokens in server env: `OWNER_TOKEN`, `WALKER_TOKEN`.
- `/login` takes a token → `loginAction` compares server-side → sets httpOnly
  `dw_auth` cookie = `role.HMAC-SHA256(role, SESSION_SECRET)`.
- Middleware bounces requests without a valid signed cookie to `/login`.
- Writes: both roles can check in; only `owner` can toggle/delete (enforced in
  Server Actions; DB accessed via server-only service-role key, never exposed).
- Supabase Auth is unused (signups stay disabled, no invites needed).

## UI (mobile-first, 2 routes)
- `/login` — magic-link form. Nothing else public. Middleware redirects anon to login.
- `/` — month calendar grid (Mon-first), green = visited, future days disabled.
  - Header: `October 2026: 12 visits — 1, 3, 5…` + prev/next month arrows.
  - Big **"I was here today"** button: idempotent insert of today (Asia/Jerusalem),
    disabled when already logged.
  - Owner day-toggle: tapping a past/today cell adds/deletes (walker sees same
    calendar read-only except the today button; delete button hidden unless owner —
    owner identified by email allowlist `OWNER_EMAIL` env).
- No export, no notes/photos, no payments in v1 (YAGNI).

## Hosting / cost ($0)
- Vercel Hobby + Supabase Free (500MB — decades of daily rows at this scale).
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OWNER_EMAIL`.
- GitHub `cyber-goth/dogwalker` as source, Vercel auto-deploy on push to main.

## Error handling
- Double-tap / double-insert → unique violation → treated as success (already logged).
- Future-date insert → rejected client + DB.
- Unauthenticated → middleware to `/login`.
- Supabase down → calendar shows error state, retry.

## Testing
- Unit: date helpers (today-in-Jerusalem, month grid builder, summary formatter).
- Manual/contract: RLS matrix (anon denied, walker insert-today ok / delete denied /
  future denied, owner delete ok), double check-in idempotent, month boundary in IDT.
- `npm run build` must pass. `npm run lint` if present.

## Out of scope (v1)
Multi-dog, multi-walker roles UI, price/payment totals, CSV/WhatsApp export,
photos, push notifications.
