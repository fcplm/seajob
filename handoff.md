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
| **Resume Builder** | ✅ Complete | All tasks done, E2E tests passing |
| **Vacancies Board** | Not started | |
| **CV Sender** | Not started | |

---

## Supabase — Real Project Connected (Session 2)

`.env.local` has been updated with real credentials:
- **Project ID:** `hsydttnoxavrdlmidjsb`
- **URL:** `https://<project-id>.supabase.co`
- **Anon key:** `<see .env.local>`

### Foundation SQL migration still needs to be run

Before logging in will work, run this in Supabase → SQL Editor:

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

### Resume Builder SQL migration also needs to be run

```sql
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users unique not null,
  bio text, availability_date date, contract_duration text,
  salary_expectation text, template text not null default 'classic',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table resumes enable row level security;
create policy "Users manage own resume" on resumes for all using (auth.uid() = user_id);

create table resume_experience (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  vessel_name text, vessel_type text, grt int, dwt int, flag text,
  company text, position text, started_at date, ended_at date, sort_order int not null default 0
);
alter table resume_experience enable row level security;
create policy "Users manage own experience" on resume_experience for all using (auth.uid() = (select user_id from resumes where id = resume_id));

create table resume_certificates (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  name text, issued_by text, issued_at date, expires_at date, sort_order int not null default 0
);
alter table resume_certificates enable row level security;
create policy "Users manage own certificates" on resume_certificates for all using (auth.uid() = (select user_id from resumes where id = resume_id));

create table resume_education (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  institution text, degree text, field text, started_at date, ended_at date, sort_order int not null default 0
);
alter table resume_education enable row level security;
create policy "Users manage own education" on resume_education for all using (auth.uid() = (select user_id from resumes where id = resume_id));

create table resume_languages (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  language text, level text, sort_order int not null default 0
);
alter table resume_languages enable row level security;
create policy "Users manage own languages" on resume_languages for all using (auth.uid() = (select user_id from resumes where id = resume_id));

create table resume_skills (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  name text, sort_order int not null default 0
);
alter table resume_skills enable row level security;
create policy "Users manage own skills" on resume_skills for all using (auth.uid() = (select user_id from resumes where id = resume_id));

create table resume_references (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  full_name text, position text, company text, email text, phone text, sort_order int not null default 0
);
alter table resume_references enable row level security;
create policy "Users manage own references" on resume_references for all using (auth.uid() = (select user_id from resumes where id = resume_id));
```

---

## Resume Builder — What's Done / What's Left

### Done
- ✅ Task 1: DB types (`lib/supabase/types.ts`) + i18n strings (`messages/en.json`, `messages/ru.json`) — commit `234af33`
- ✅ Design spec: `docs/superpowers/specs/2026-06-28-resume-builder-design.md`
- ✅ Implementation plan: `docs/superpowers/plans/2026-06-28-resume-builder.md`

### Pending (Tasks 3–9)
- Task 3: Server actions (`actions/resume.ts`)
- Task 4: shadcn accordion/textarea + `completeness-bar.tsx` + `template-picker.tsx`
- Task 5: `section-personal.tsx` + `section-preferences.tsx`
- Task 6: All 6 list section components
- Task 7: `resume-editor.tsx` + dashboard resume page + fix `hasResume`
- Task 8: PDF templates + `/api/resume/pdf` route handler
- Task 9: E2E tests + final build verification

### Next session — start here
Say **"продолжай с Task 3"** and execution will resume from Task 3 using subagent-driven development.

SDD progress ledger: `.superpowers/sdd/progress.md`
Plan file: `docs/superpowers/plans/2026-06-28-resume-builder.md`

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
| `234af33` | Resume Builder: DB types + i18n strings |

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
      resume|vacancies|sender|notifications/page.tsx  — placeholders (resume will be replaced)
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
| Analytics widget shows 0/0 | By design | CV Sender sub-project will fix this |
| Stripe payments are placeholder UI | By design | Real integration is a future phase |
