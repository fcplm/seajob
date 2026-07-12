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
| **CV Sender** | ⚠️ Implemented, white screen bug active | See below |

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

### Pending manual steps before testing in browser

1. **Run vacancies SQL** in Supabase Dashboard:
```sql
create table vacancies (
  id            uuid primary key default gen_random_uuid(),
  external_id   text unique not null,
  source        text not null,
  rank          text,
  company       text,
  vessel_type   text,
  salary        text,
  description   text,
  contact_email text,
  url           text,
  posted_at     timestamptz,
  is_urgent     boolean not null default false,
  created_at    timestamptz default now()
);
alter table vacancies enable row level security;
create policy "Authenticated users read vacancies"
  on vacancies for select
  using (auth.role() = 'authenticated');
```

2. **Set real env vars** in `.env.local`:
   - `RESEND_API_KEY` — from resend.com
   - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings → API
   - `CRON_SECRET` — any random string (also add to Vercel env)

3. **Trigger first sync** manually: `POST /api/vacancies/sync` with `Authorization: Bearer <CRON_SECRET>`

## CV Sender — What Was Built (Session 5)

### Key commits (oldest → newest)

| Hash | Description |
|------|-------------|
| `715f8b2` | DB types, i18n, deps, import script (2113 employers), cron config |
| `4e97cc5` | Employer management — admin table, CSV import, add form |
| `43c6b8b` | Employer table i18n + revalidatePath fix |
| `7f9cfa4` | Sender page — fleet filter, cover letter, AI translate, launch action |
| `1a4c9c9` | Sender i18n — toasts, placeholder, fleet label |
| `524084b` | Queue processor — cron route, batch email send |
| `7ac29e0` | Progress polling, real analytics widget, E2E tests |
| `53302e2` | Fix: campaign-progress fleet_type i18n |
| `45b82c9` | Fix: race condition + active-campaign guard |

### Key new files

```
actions/sender.ts                              — translateCoverLetter, launchCampaign, getActiveCampaign
actions/employers.ts                           — addEmployer, importEmployersCsv, toggleEmployerActive
components/sender/
  sender-client.tsx                            — fleet filter + cover letter + recipient list + launch
  sender-page-content.tsx                      — client wrapper for full page (ssr:false)
  fleet-filter.tsx                             — 5 fleet type buttons
  cover-letter-field.tsx                       — textarea + AI translate button
  recipient-list.tsx                           — expandable employer list with checkboxes
  campaign-progress.tsx                        — progress bar with 10s polling
  employer-table.tsx                           — admin CRUD table
app/[locale]/dashboard/sender/page.tsx        — server component (data fetch + ssr:false wrapper)
app/[locale]/dashboard/sender/employers/page.tsx — admin-only employer management
app/api/sender/process/route.ts               — cron: batch email send (GET + POST)
app/global-error.tsx                          — global error boundary
e2e/sender.spec.ts                            — unauthenticated redirect tests
next.config.mjs                               — added @anthropic-ai/sdk + @react-pdf/renderer to serverComponentsExternalPackages
```

### How it works

- Admin imports employers via CSV → stored in `employers` table (2113 contacts, segmented by fleet_type)
- User selects fleet type → writes cover letter → optionally AI-translates it → launches campaign
- `launchCampaign` server action: cooldown check → create `send_campaigns` row + `send_jobs` rows → cron picks up
- Cron at `/api/sender/process`: claims up to 50 pending jobs atomically → renders PDF → sends via Resend → updates status
- `CampaignProgress` polls `getActiveCampaign()` every 10s while campaign is running

### Env vars required (see `.env.local`)

```
ANTHROPIC_API_KEY=...     — for AI cover letter translation
RESEND_API_KEY=...        — for email delivery
RESEND_FROM_EMAIL=...     — sender address (configured domain)
SUPABASE_SERVICE_ROLE_KEY=...  — for bulk job inserts (bypasses RLS)
CRON_SECRET=...           — Bearer token for /api/sender/process
ADMIN_EMAIL=...           — grants access to /dashboard/sender/employers
```

### Supabase SQL (must be run if not already)

```sql
create table employers (
  id uuid primary key default gen_random_uuid(),
  company text,
  email text not null,
  fleet_type text not null check (fleet_type in ('merchant','tanker','offshore','bulk','cruise')),
  is_active boolean not null default true,
  created_at timestamptz default now()
);
alter table employers enable row level security;
create policy "Auth users read employers" on employers for select using (auth.role() = 'authenticated');
create policy "Service role manages employers" on employers for all using (true);

create table send_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  fleet_type text not null,
  cover_letter text,
  resume_pdf_b64 text,
  status text not null default 'pending' check (status in ('pending','running','done','failed')),
  total_count int not null default 0,
  sent_count int not null default 0,
  failed_count int not null default 0,
  completed_at timestamptz,
  created_at timestamptz default now()
);
alter table send_campaigns enable row level security;
create policy "Users manage own campaigns" on send_campaigns for all using (auth.uid() = user_id);

create table send_jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references send_campaigns not null,
  employer_id uuid references employers not null,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  sent_at timestamptz,
  error text,
  created_at timestamptz default now()
);
alter table send_jobs enable row level security;
create policy "Users manage own jobs" on send_jobs for all using (
  exists (select 1 from send_campaigns where id = campaign_id and user_id = auth.uid())
);
```

### ✅ Bug Fixed — White Screen Was Stale Build Cache

**Root cause:** Running `npm run build` while the dev server was live left the `.next` cache in an inconsistent state. The vendor chunk `next-intl.js` was absent from the dev server's module map, causing 500 errors on all pages.

**Fix:** Cleared `.next` directory + restarted dev server. No code changes needed.

**What changed during debugging (kept — all are improvements):**
- `@anthropic-ai/sdk` added to `serverComponentsExternalPackages` — prevents webpack from bundling it
- `getActiveCampaign()` uses explicit column list (no `resume_pdf_b64`) — smaller RSC payload
- `SenderPageContent` wrapped in `dynamic({ ssr: false })` — eliminates hydration risk on this data-heavy page
- `app/global-error.tsx` added — global React error boundary
- `app/[locale]/layout.tsx` has `translate="no"` — prevents browser translation DOM mutation

**To start dev server:** `npm run dev` (from repo root). After any `npm run build`, always do `rm -rf .next` + `npm run dev` to avoid stale cache.

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

## Session 6 Fixes (2026-07-02)

| Fix | Commit |
|-----|--------|
| Ticker animation — added `@keyframes ticker` CSS + wired up in landing page | `2c5197a` |
| ProfileCard — async server component, translates fleet_type via `getTranslations` | `2c5197a` |
| ActivityWidget — real props showing last campaign fleet/status/count | `2c5197a` |
| Profile form — `bulk` SelectItem added; `bulk`/`downloadingPdf` i18n keys added | `2c5197a` |
| Dashboard analytics query — now fetches `fleet_type`+`created_at`, passes lastCampaign | `2c5197a` |
| Resume editor — programmatic PDF fetch + error toast via sonner | `2c5197a` |
| Profile type — `bulk` added to `Profile.fleet_type` union in `lib/supabase/types.ts` | `aad051d` |

### ✅ Profiles constraint updated

```sql
-- Already run in Supabase Dashboard:
ALTER TABLE profiles DROP CONSTRAINT profiles_fleet_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_fleet_type_check
  CHECK (fleet_type IN ('merchant','tanker','offshore','bulk','cruise'));
```

---

## Session 7 Fixes (2026-07-03)

| Fix | Commit |
|-----|--------|
| RSS parser — handle jobatsea title format, extract salary from title + description | `d8115f0` |
| Vacancies table — created in Supabase, first sync triggered (10 vacancies loaded) | manual |
| CRON_SECRET — generated real value in `.env.local` | manual |

### Vacancies are live

- Table `vacancies` exists and has data (synced from jobatsea.online RSS)
- Cron at `/api/vacancies/sync` runs hourly on Vercel (or trigger manually with `CRON_SECRET`)
- Manually trigger: `curl -X POST http://localhost:3000/api/vacancies/sync -H "Authorization: Bearer <CRON_SECRET>"`

### Env vars still needed for full CV Sender

- `RESEND_API_KEY` — email delivery (from resend.com)
- `ANTHROPIC_API_KEY` — AI cover letter translation

---

## Known Deferred Items

| Item | Severity | Notes |
|------|----------|-------|
| `nav.about` key exists but no About page | Minor | Dead i18n key |
| Stripe payments are placeholder UI | By design | Future phase |
| Form validation client-side only | Minor | Server actions already guard ownership |
| RESEND_API_KEY not set | Medium | CV Sender emails won't send without it |
| ANTHROPIC_API_KEY not set | Low | AI translate button will error |
