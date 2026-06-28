# SeaJob — Claude Code Instructions

## Workflow

- **Stop and ask for approval after completion of a task** before starting the next one.
- All user-facing strings must come from next-intl — no hardcoded UI text. Add keys to both `messages/en.json` and `messages/ru.json`.
- Never hardcode `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `.env.local` only.
- Run `npm run build` and `npx playwright test --project=chromium` before marking any task done.

## Stack

- Next.js 14 App Router (no Pages Router), TypeScript strict mode
- Tailwind CSS + shadcn/ui (Default style, Slate base color, Radix UI — NOT Base UI)
- next-intl v4 with `requestLocale` Promise API — URL routing `/en/` and `/ru/`
- Supabase with `@supabase/ssr` — separate `createBrowserClient` / `createServerClient`
- Server Actions for all mutations

## Key Paths

| What | Where |
|------|-------|
| i18n config | `i18n/request.ts` |
| Messages | `messages/en.json`, `messages/ru.json` |
| Supabase clients | `lib/supabase/client.ts`, `lib/supabase/server.ts` |
| Auth actions | `actions/auth.ts` |
| Middleware | `middleware.ts` |
| Dashboard layout | `app/[locale]/dashboard/layout.tsx` |
| E2E tests | `e2e/` |
