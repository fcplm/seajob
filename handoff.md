# SeaJob — Session Handoff

> Update this file after each session. Keep it current — it is the single source of truth for where work stands.

---

## Project Overview

**SeaJob** — a web platform for seafarers to simplify job searching.

Four sub-systems planned:
1. **Resume Builder** — quiz-based CV creation, PDF export
2. **Vacancies Board** — job listings with fleet-type filters
3. **CV Sender** — automated bulk email to fleet-segmented employer databases
4. **Personal Dashboard** — subscription payments, profile, resume management

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 App Router, TypeScript strict |
| Styling | Tailwind CSS + shadcn/ui (Default/Slate/Radix) |
| i18n | next-intl v4, `/en/` and `/ru/` URL routing |
| Database & Auth | Supabase (PostgreSQL + RLS + OAuth) |
| Email | Resend (planned — not yet implemented) |
| Payments | Stripe placeholder UI (no real integration yet) |
| Testing | Playwright (Chromium) |

---

## Implementation Phases

| Phase | Status | Notes |
|-------|--------|-------|
| **Foundation** | ✅ Complete | All 9 tasks done, 6/6 E2E tests passing |
| **Resume Builder** | Not started | |
| **Vacancies Board** | Not started | |
| **CV Sender** | Not started | |

---

## Foundation — What Was Built (Session 1)

### Commits (oldest → newest)

| Hash | Description |
|------|-------------|
| `1db2e2a` | Initial commit |
| `d46b896` | Foundation design spec |
| `6835ba1` | Foundation implementation plan |
| `bd622b3` | Init Next.js 14 + shadcn/ui + Supabase deps |
| `dd2eed3` | Reinit shadcn Default/Slate, fix duplicate fonts |
| `8b164f5` | Remove unused `@base-ui/react`, `tw-animate-css` |
| `7376c4a` | next-intl i18n with RU/EN messages |
| `236408f` | Middleware: i18n routing + dashboard auth guard |
| `817960d` | Supabase client, server client, types, DB schema |
| `95615e9` | Auth pages, server actions, Google OAuth, E2E tests |
| `c6dba77` | Fix auth i18n, unused import, OAuth callback errors |
| `592baf0` | Landing page with all sections + lang switcher |
| `8873921` | Move all landing strings to i18n |
| `aa5ddd0` | Dashboard layout: sidebar + mobile bottom bar |
| `abf1c26` | Dashboard home widgets |
| `55160ca` | Fix resumeCreated string, profile type cast |
| `669b200` | Dashboard sub-pages: profile, settings, placeholders |
| `9ee8d2c` | Fix profile form remount, saving key, fetch errors |
| `588a0b8` | Final fixes: boilerplate cleanup, redirect flow, fleet_type null, popular badge, callback locale guard |

### Key Files

```
app/
  layout.tsx                    — pass-through root layout (lang attr lives in locale layout)
  [locale]/
    layout.tsx                  — html/body, fonts, NextIntlClientProvider
    page.tsx                    — landing page
    auth/callback/route.ts      — OAuth callback
    dashboard/
      layout.tsx                — sidebar + bottom bar
      page.tsx                  — dashboard home
      profile/page.tsx          — profile edit form
      settings/page.tsx         — settings (lang switcher)
      resume|vacancies|sender|notifications/page.tsx  — placeholders
actions/auth.ts                 — login, signup, logout, updateProfile server actions
components/
  auth/login-form.tsx signup-form.tsx
  layout/header.tsx sidebar.tsx bottom-bar.tsx footer.tsx
  dashboard/profile-card.tsx subscription-widget.tsx resume-widget.tsx ...
lib/supabase/client.ts server.ts types.ts
i18n/request.ts
messages/en.json ru.json
middleware.ts
e2e/auth.spec.ts navigation.spec.ts
```

---

## Known Deferred Items

| Item | Severity | Notes |
|------|----------|-------|
| Profile card shows raw DB fleet_type value | Minor | Needs async server component or client translation |
| `nav.about` key exists but no About page/anchor | Minor | Dead translation key |
| `hasResume` hardcoded `false` | By design | Resume Builder sub-project will fix this |
| Analytics widget shows 0/0 | By design | CV Sender sub-project will fix this |
| Stripe payments are placeholder UI | By design | Real integration is a future phase |

---

## Manual Setup Steps (Required Before Production)

The app runs with placeholder Supabase credentials. To connect a real backend:

1. **Create Supabase project** at supabase.com
2. **Run SQL migration** (schema is in `docs/superpowers/specs/2026-06-27-seajob-foundation-design.md`):
   ```sql
   create table profiles (
     id uuid references auth.users primary key,
     full_name text,
     rank text,
     fleet_type text check (fleet_type in ('merchant','tanker','offshore','cruise')),
     phone text,
     photo_url text,
     subscription_status text not null default 'free',
     created_at timestamptz default now()
   );
   alter table profiles enable row level security;
   create policy "Users manage own profile" on profiles
     for all using (auth.uid() = id);
   create function handle_new_user() returns trigger as $$
   begin
     insert into public.profiles (id, full_name)
     values (new.id, new.raw_user_meta_data->>'full_name');
     return new;
   end;
   $$ language plpgsql security definer;
   create trigger on_auth_user_created after insert on auth.users
     for each row execute function handle_new_user();
   ```
3. **Configure Google OAuth** in Supabase dashboard → Auth → Providers
4. **Update `.env.local`**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

---

## Next Session — Suggested Start

Ask to begin **Phase 2: Resume Builder** or any of the remaining sub-systems.

Spec and plan files live in `docs/superpowers/`.
