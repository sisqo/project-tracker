# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Project Tracker is an internal project-management app: an organizational unit that delivers projects on request from other units tracks who asked for what, who owns it, and what tasks remain. Multi-user with roles (`Administrator` / `User` globally, `owner` / `member` per project), an audit trail, and no outbound email — first access and password resets are admin-mediated one-time links, not self-service.

The functional plan (entities, relationships, cross-cutting rules) that this app implements was supplied by the user as a design doc, not stored in-repo; the schema in `src/lib/db/schema.ts` is its direct translation. Naming: entities `PascalCase`, fields `camelCase` in code — mapped mechanically to `snake_case` tables/columns in Postgres.

Deployed at https://project-tracker.sisqo.dev (Vercel project `project-tracker` under team `sisqoz`, GitHub repo `sisqo/project-tracker`).

## Stack

Next.js 15 (App Router) + TypeScript + Drizzle ORM + Neon Postgres + next-auth v5 (Credentials only, JWT sessions) + Vercel Blob (private store, for file attachments) + Tailwind v3. No React Query / SWR — server actions + `revalidatePath`.

This mirrors the working pattern already proven in this account's `songbook` project (same Neon/Drizzle/next-auth combination) rather than introducing a new stack.

`@vercel/blob` needs Node >= 20 (for private-store support — see Attachments below); this sandbox runs Node 18, so `npm install` prints an `EBADENGINE` warning that's safe to ignore here. The Vercel project itself is configured for Node 24.x, so this doesn't affect the deployed app.

## Commands

```bash
npm run dev          # Next dev server
npm run build        # next build (also typechecks)
npm run lint         # eslint
npm run db:generate  # drizzle-kit generate — after editing src/lib/db/schema.ts
npm run db:migrate   # applies drizzle/*.sql against DATABASE_URL_UNPOOLED
npm run seed:admin   # bootstrap the first Administrator (see below)
```

There is no test suite. Verify behavioral changes by running the dev server and exercising the flow for real — this app leans on Server Actions (forms and direct `startTransition` calls) and a real Postgres database, neither of which a type-check alone will catch.

## Database

`vercel env pull .env.local` refreshes `DATABASE_URL` / `DATABASE_URL_UNPOOLED` (Neon, resource `project-tracker-db`) and `BLOB_READ_WRITE_TOKEN` (Blob store `project-tracker-files`, private access). `src/lib/db/client.ts` connects over the **pooled** endpoint with `max: 1` — Next dev recompiles route entries independently, so this "singleton" pool gets re-instantiated far more often in dev than in production; without a small `max` and a `connect_timeout`, that showed up as requests hanging indefinitely instead of failing fast. Migrations run against `DATABASE_URL_UNPOOLED` (see `scripts/migrate.ts`) since PgBouncer's transaction pooling mode can't carry DDL.

Neon's free-tier compute auto-suspends when idle; the first request after a quiet period can take several seconds while it wakes back up. That's expected, not a bug — `connect_timeout: 20` gives it room.

**Bootstrapping the first Administrator**: nothing in the app creates one (by design — every other account is created *by* an Administrator). Run `npm run seed:admin -- --email you@example.com --password 'something' --first Your --last Name` once against a fresh database.

## Auth

Email + password, `bcryptjs` hashes, next-auth v5 Credentials provider, JWT sessions (30 days). `requireUser()` / `requireAdmin()` (`src/lib/auth/current-user.ts`) re-fetch the user row from the database on every call rather than trusting the JWT for `role`/`isActive` — both can change mid-session (an Administrator can demote or deactivate someone), and the JWT alone would keep granting the old permissions until it expired.

First access and "forgot password" are the same mechanism: `src/lib/auth/password-reset.ts` issues a one-time, 7-day token; an Administrator generates the link from a user's row in `/admin/users` and delivers it out of band (chat, in person — whatever channel already exists for this org). There is no email sending anywhere in this app.

## Authorization shape

- `User.role` (`Administrator` / `User`) is global.
- `owner` / `members` are per-project. The owner is *implicitly* a member — never inserted into `project_members` — so every permission check is `role === 'Administrator' || userId === project.ownerId || memberIds.includes(userId)`, not a plain membership-table lookup. See `src/lib/permissions.ts`.
- `Task.assignee` must be in that same set (owner ∪ members). Enforced on both task writes (`isValidAssignee` checks in the task actions) and on member removal (`src/lib/reassignment.ts` finds open tasks before letting a removal or deactivation proceed) — the spec calls this out explicitly as a rule that must hold on both sides, not just at write time.

## Guided flows

Three places block a direct mutation and route to a confirmation step instead, per the functional plan's cross-cutting rules (not incidental UX):

- Removing a project member who has open tasks → `/projects/[id]/members/[userId]/remove`, reassign-or-clear per task, then remove.
- Deactivating a user who has open tasks *anywhere* → `/admin/users/[id]/deactivate`, same pattern, project-agnostic.
- Marking a project `Completed` with open tasks still in it → inline confirm in `StatusForm`, not a route (lower stakes, no data to reassign).

## Audit trail

`src/lib/audit.ts` is the only writer of `audit_entries`, and the only place that decides how a value gets serialized. Relation fields (`Project.members`, `Project.tags`, `Task.assignee`, `Project.owner`) are always logged as a human-readable key — sorted emails or tag names — never a raw id; get it from `resolveUserEmail()` / `serializeSet()` rather than writing a fresh ad hoc format at a new call site.

## Known v1 simplifications (deliberate, not oversights)

- **Board/list reordering is up/down buttons, not drag-and-drop.** `sortOrder` is scoped per `(project, status)` — moving a task to a different board column re-numbers it to the end of that column and records a `status` audit entry; reordering within a column swaps `sortOrder` with the adjacent task. A native-HTML5-DnD implementation was considered and dropped in favor of this — same persistent manual ordering the spec asks for, far less edge-case surface.
- **Attachments cap at 4 MB** (`MAX_ATTACHMENT_BYTES` in `src/lib/blob.ts`) and go through a Server Action multipart upload rather than a direct-to-blob client upload flow. The cap isn't arbitrary: Vercel Functions hard-limit the request body to 4.5 MB platform-wide, independent of Next's own `serverActions.bodySizeLimit` (`next.config.ts`) — that setting can lower Next's threshold below the platform ceiling but never raise it past it. 4 MB leaves headroom for multipart overhead so a file at the line fails this app's own validation message instead of a raw Vercel 413.
- **CSV, not XLSX**, for exports (`src/lib/csv.ts` — UTF-8 BOM so Excel opens accented characters correctly). Opens fine in Excel; no spreadsheet-generation dependency.
- **Dashboard numbers exclude archived projects and carry no historical window** — a current-state snapshot, not a report over time.
