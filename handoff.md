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
| PDF | @react-pdf/renderer |
| Email | Resend (planned — not yet implemented) |
| Payments | Stripe placeholder UI (no real integration yet) |
| Testing | Playwright (Chromium) |

---

## Implementation Phases

| Phase | Status | Notes |
|-------|--------|-------|
| **Foundation** | ✅ Complete | Auth, dashboard, profile, i18n, E2E |
| **Resume Builder** | ✅ Complete | All tasks done, 8/8 E2E tests passing |
| **Vacancies Board** | ✅ Complete | All tasks done, 11/13 E2E tests passing (2 skipped — need credentials) |
| **CV Sender** | Not started | |

---

## Supabase — Real Project Connected

`.env.local` has real credentials (URL + anon key). Both SQL migrations have been run.

- **Project ID:** `hsydttnoxavrdlmidjsb`
- Credentials: see `.env.local` only

### Both migrations are ALREADY RUN — do not run again

<details>
<summary>Foundation SQL (profiles table) — already applied</summary>

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
</details>

<details>
<summary>Resume Builder SQL (7 tables) — already applied</summary>

```sql
create table resumes ( id uuid primary key default gen_random_uuid(), user_id uuid references auth.users unique not null, bio text, availability_date date, contract_duration text, salary_expectation text, template text not null default 'classic', created_at timestamptz default now(), updated_at timestamptz default now() );
-- (+ 6 child tables: resume_experience, resume_certificates, resume_education, resume_languages, resume_skills, resume_references with RLS)
```
</details>

---

## Resume Builder — What Was Built (Session 3)

### Key commits (oldest → newest)

| Hash | Description |
|------|-------------|
| `234af33` | DB types + i18n strings |
| `9e1a03e` | Resume server actions |
| `43d18e9` | Fix: scope update/delete to user's own resume |
| `518c77d` | accordion/textarea + completeness-bar + template-picker |
| `38bfea6` | Fix: i18n Pro badge |
| `423233a` | section-personal + section-preferences |
| `f52593a` | Fix: i18n placeholder strings |
| `53a7678` | All 6 list section components |
| `46c9e6c` | Fix: i18n + dedup form JSX |
| `f3d5a3a` | resume-editor + dashboard resume page |
| `e786be8` | PDF templates + /api/resume/pdf route |
| `9b7157a` | Fix: isPro allowlist + null-safe separators in PDF |
| `6acb197` | Fix: null-safe language level in compact/modern PDF |
| `59fccbc` | E2E tests for resume builder |
| `0cc8211` | Fix: isPro UI consistency, ensureResume upsert, education date, PDF filename |
| `152e8b6` | Feat: save button disabled when required field empty |

### Key new files

```
actions/resume.ts                        — 20 server actions (CRUD for all sections)
components/resume/
  completeness-bar.tsx                   — progress bar component
  template-picker.tsx                    — Classic/Modern/Compact picker with Pro gating
  section-personal.tsx                   — bio textarea
  section-preferences.tsx                — availability, contract, salary
  section-experience.tsx                 — sea experience (vessel, company, dates)
  section-certificates.tsx               — certificates (name, issuer, dates)
  section-education.tsx                  — education (institution, degree, field)
  section-languages.tsx                  — languages with CEFR level select
  section-skills.tsx                     — skills as badge chips
  section-references.tsx                 — references (name, position, contact)
  resume-editor.tsx                      — accordion editor assembling all sections
  pdf/
    template-classic.tsx                 — Classic PDF layout
    template-modern.tsx                  — Modern PDF layout
    template-compact.tsx                 — Compact PDF layout (Pro only)
app/[locale]/dashboard/resume/page.tsx  — server component, fetches all resume data
app/api/resume/pdf/route.ts             — PDF generation (auth → fetch → render → stream)
e2e/resume.spec.ts                      — Playwright tests
```

### How it works

- `/en/dashboard/resume` — server component fetches profile + all 7 resume tables in parallel, passes to `<ResumeEditor>`
- `<ResumeEditor>` — client component with shadcn Accordion, tracks completeness per section
- Save in each section calls a server action → revalidates
- Download PDF → `/api/resume/pdf?template=classic` → auth check → renders `@react-pdf/renderer` template → streams PDF
- Free users: Classic template only. Pro/Enterprise: all 3 templates

---

## Vacancies Board — What Was Built (Session 4)

### Key commits (oldest → newest)

| Hash | Description |
|------|-------------|
| `53d39e7` | DB types, i18n strings, deps, vercel cron config |
| `b454c2a` | RSS parser + `/api/vacancies/sync` route (Vercel cron) |
| `3076f5b` | Vacancies board UI — page, card grid, fleet-type filters |
| `7654075` | `applyToVacancy` server action — PDF attachment + Resend email |
| `9e56efa` | E2E tests for vacancies + playwright config port fix |

### Key new files

```
app/[locale]/dashboard/vacancies/page.tsx  — server component, fetches vacancies from Supabase
components/resume/vacancy-card.tsx         — card with apply button
components/resume/vacancy-filters.tsx      — fleet-type filter chips
app/api/vacancies/sync/route.ts            — cron endpoint: fetch XML RSS → upsert to Supabase
actions/resume.ts (applyToVacancy)         — builds PDF resume + emails employer via Resend
e2e/vacancies.spec.ts                      — Playwright tests (3 unauthenticated + 1 skipped)
```

### How it works

- Vercel cron job hits `/api/vacancies/sync` every hour → parses ITF/maritime RSS feed → upserts `vacancies` table
- `/en/dashboard/vacancies` — server component, reads `vacancies` table, supports fleet_type filter param
- Apply button calls `applyToVacancy` server action → fetches user's resume → renders PDF → emails employer

### Playwright config note

Port 3000 was in use by a different process during testing, so `playwright.config.ts` was updated to use `PORT=3001`. This is the permanent correct config — dev server for SeaJob runs on 3001 when port 3000 is occupied.

## Next Session — CV Sender

---

## Foundation — Key Files

```
app/[locale]/
  layout.tsx                  — html/body, fonts, NextIntlClientProvider
  page.tsx                    — landing page
  auth/callback/route.ts      — OAuth callback
  dashboard/
    layout.tsx                — sidebar + bottom bar
    page.tsx                  — dashboard home (hasResume now live query)
    profile/page.tsx          — profile edit form
    settings/page.tsx         — settings (lang switcher)
actions/auth.ts               — login, signup, logout, updateProfile
lib/supabase/client.ts server.ts types.ts
messages/en.json ru.json
middleware.ts
e2e/auth.spec.ts navigation.spec.ts resume.spec.ts
```

---

## Known Deferred Items

| Item | Severity | Notes |
|------|----------|-------|
| Profile card shows raw DB fleet_type value | Minor | Needs client translation |
| `nav.about` key exists but no About page | Minor | Dead i18n key |
| Analytics widget shows 0/0 | By design | CV Sender phase will fix |
| Stripe payments are placeholder UI | By design | Future phase |
| PDF download error not shown as toast | Minor | pdfError i18n key exists but unused |
| Form validation client-side only | Minor | Server actions already guard ownership |
