# CV Sender — Design Spec

**Date:** 2026-06-30
**Status:** Approved

---

## Overview

A bulk CV sending tool inside the SeaJob dashboard. The user selects a fleet type, writes a cover letter (optionally translated to professional English via Claude AI), previews the recipient list, and launches a campaign. SeaJob queues individual emails and delivers them via Resend with the user's PDF resume attached. A 7-day cooldown per fleet type prevents spam.

---

## Scope

- Shared employer database managed by admin only
- Bulk send to all active employers in a fleet-type segment
- AI-powered cover letter translation (RU → professional EN) via Claude Haiku
- Queue-based delivery (50 emails per cron tick, every 5 min)
- 7-day cooldown per fleet type per user
- Employer database management: CSV import + manual add/edit (admin only)
- Analytics widget on dashboard home shows real sent counts
- Gmail import: external Node.js script (not part of the app)

---

## Data Model

### New table: `employers`

```sql
create table employers (
  id          uuid primary key default gen_random_uuid(),
  company     text,
  email       text unique not null,
  fleet_type  text not null check (fleet_type in ('merchant','tanker','offshore','bulk','cruise')),
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);

alter table employers enable row level security;

-- All authenticated users can read active employers
create policy "Authenticated users read employers"
  on employers for select
  using (auth.role() = 'authenticated' and is_active = true);

-- Only service role can insert/update/delete (admin routes use service key)
```

### New table: `send_campaigns`

```sql
create table send_campaigns (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  fleet_type    text not null,
  cover_letter  text,
  status        text not null default 'pending'
                check (status in ('pending','running','done','failed')),
  total_count   int not null default 0,
  sent_count    int not null default 0,
  failed_count  int not null default 0,
  created_at    timestamptz default now(),
  completed_at  timestamptz
);

alter table send_campaigns enable row level security;

create policy "Users manage own campaigns"
  on send_campaigns for all
  using (auth.uid() = user_id);
```

### New table: `send_jobs`

```sql
create table send_jobs (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid references send_campaigns not null,
  employer_id  uuid references employers not null,
  status       text not null default 'pending'
               check (status in ('pending','sent','failed')),
  sent_at      timestamptz,
  error        text,
  created_at   timestamptz default now()
);

alter table send_jobs enable row level security;

create policy "Users manage own jobs"
  on send_jobs for all
  using (
    campaign_id in (
      select id from send_campaigns where user_id = auth.uid()
    )
  );
```

---

## Cooldown Logic

A user cannot launch a new campaign for a fleet type if they have a `send_campaigns` row where:
- `fleet_type` matches AND
- `created_at > now() - interval '7 days'`

Check is done server-side in the Server Action before creating a new campaign.

---

## Admin Role

Admin is determined by: `user.email === process.env.ADMIN_EMAIL`

Employer management routes check this condition. Regular users see the sender page but not the employer management section.

---

## Routes

| Route | Who | Purpose |
|-------|-----|---------|
| `/[locale]/dashboard/sender` | All users | Launch campaigns, view progress |
| `/[locale]/dashboard/sender/employers` | Admin only | View/add/edit employers, CSV import |

---

## Sender Page — `/dashboard/sender`

### Layout

```
┌──────────────────────────────────────────────────┐
│  CV Sender                                       │
│                                                  │
│  1. Select fleet type:                           │
│     [ Merchant ]  [ Tanker ]  [ Offshore ]       │
│     [ Bulk ]  [ Cruise ]                         │
│                                                  │
│  2. Cover letter:                                │
│  ┌────────────────────────────────────────────┐  │
│  │ Dear Sir/Madam,                            │  │
│  │ I am writing to express interest in...     │  │
│  └────────────────────────────────────────────┘  │
│  [ ✨ Translate to professional English ]         │
│                                                  │
│  3. Recipients: 258 companies   [▼ Show list]    │
│  ┌────────────────────────────────────────────┐  │
│  │ ✓ resume@dpship.com        DP Ship         │  │
│  │ ✓ recruitment@wintermar.com Wintermar      │  │
│  │ ✓ jobs@nwcrewing.com       NW Crewing      │  │
│  │ ...                                        │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  [ 🚀 Launch campaign — 258 emails ]             │
│                                                  │
│  ── Active campaign ──────────────────────────── │
│  Offshore · Sent: 150 / 258                      │
│  [████████████░░░░░░░░] 58%                      │
└──────────────────────────────────────────────────┘
```

If cooldown active:
```
[ Next Offshore campaign available in 5 days ]
```

### States

- **No resume** → show "Create your resume first" with link to `/dashboard/resume`
- **Cooldown active** → button disabled with countdown
- **Campaign running** → progress bar, no new launch until done
- **Campaign done** → success state, cooldown starts

---

## AI Cover Letter Translation

**Server Action:** `actions/sender.ts` → `translateCoverLetter(text: string)`

1. Call Anthropic API with model `claude-haiku-4-5-20251001`
2. System prompt: *"You are an experienced maritime HR professional. Rewrite the provided text as a professional cover letter in English for a crewing/shipping company. Use proper business letter structure (greeting, body, closing). Keep it concise (3-4 paragraphs). Maintain a confident, professional tone appropriate for seafarer job applications. Do not add fictional details."*
3. Return translated text
4. User sees result in the textarea, can edit before sending

**New env var:** `ANTHROPIC_API_KEY` — already present in `.env.local` (used by Claude Code)

---

## Campaign Launch — Server Action

**`actions/sender.ts` → `launchCampaign(fleetType, coverLetter, excludedEmployerIds)`**

1. Verify user is authenticated
2. Check cooldown — if active, return `{ ok: false, error: 'cooldown', availableAt: Date }`
3. Check user has resume — if not, return `{ ok: false, error: 'no_resume' }`
4. Fetch all active employers for fleet_type (excluding unchecked ones)
5. Create `send_campaigns` row with status `pending`, total_count = employer count
6. Bulk insert `send_jobs` (one per employer), all status `pending`
7. Return `{ ok: true, campaignId }`

---

## Queue Processing — Cron Route

**`app/api/sender/process/route.ts`**

- Method: GET (Vercel Cron) or POST (manual trigger)
- Auth: `Authorization: Bearer $CRON_SECRET`
- Logic per tick:
  1. Find `send_campaigns` with status `pending` or `running`, ordered by `created_at ASC`
  2. Take the first running campaign (one at a time across all users)
  3. Set campaign status to `running`
  4. Fetch up to 50 `send_jobs` with status `pending` for that campaign
  5. For each job:
     - Fetch employer email
     - Fetch user's resume data + profile
     - Generate PDF via `renderToBuffer`
     - Send via Resend: To = employer email, From = `RESEND_FROM_EMAIL`, Subject = `Application — [rank], [full_name]`, Body = cover_letter text, Attachment = resume.pdf
     - Mark job `sent` or `failed`
  6. Update campaign `sent_count` and `failed_count`
  7. If no more pending jobs → set campaign `completed_at` and status `done`
- Returns `{ processed: N }`

**Vercel cron** (`vercel.json` — add alongside existing sync cron):
```json
{ "path": "/api/sender/process", "schedule": "*/5 * * * *" }
```

---

## Employer Management — `/dashboard/sender/employers`

Admin-only. Checks `user.email === process.env.ADMIN_EMAIL`, else redirect to `/dashboard/sender`.

### Layout

```
┌──────────────────────────────────────────────────┐
│  Employer Database             [+ Add]  [↑ CSV]  │
│                                                   │
│  Filter: [ All ] [ Merchant ] [ Tanker ] [Offshore│
│  Search: [___________________________]            │
│                                                   │
│  Company              Email              Fleet    │
│  DP Ship Management   resume@dpship.com  Offshore │
│  Wintermar            recrui@wintermar   Offshore │
│  ...                                             │
│                                        2113 total │
└──────────────────────────────────────────────────┘
```

**Add employer:** modal form — company (optional), email (required), fleet_type (required)

**CSV import:** file input → parse → upsert on `email` conflict (update company/fleet_type, keep is_active)

CSV format (matches `employers_import.csv` already generated):
```
company,email,fleet_type
DP Ship,resume@dpship.com,offshore
```

---

## Initial Data Import

A one-time script `scripts/import-employers.ts`:
- Reads `/Users/sergeymedinskiy/Downloads/employers_import.csv`
- Upserts into `employers` table via service role key
- Run once: `npx tsx scripts/import-employers.ts`

---

## Analytics Widget (Dashboard Home)

Replace the hardcoded `0` values in `components/dashboard/analytics-widget.tsx` with real queries:

- **Emails Sent** = `sum(sent_count)` from `send_campaigns` where `user_id = current_user`
- **Campaigns** = `count(*)` from `send_campaigns` where `user_id = current_user` and `status = 'done'`

---

## i18n Keys

Add to `messages/en.json` and `messages/ru.json` under `"sender"` namespace:

| Key | EN | RU |
|-----|----|----|
| `title` | CV Sender | Рассылка резюме |
| `selectFleet` | Select fleet type | Выберите тип флота |
| `coverLetter` | Cover letter | Сопроводительное письмо |
| `translate` | ✨ Translate to English | ✨ Перевести на English |
| `translating` | Translating... | Перевожу... |
| `recipients` | {count} companies | {count} компаний |
| `showList` | Show list | Показать список |
| `hideList` | Hide list | Скрыть список |
| `launch` | Launch campaign | Запустить рассылку |
| `launching` | Launching... | Запускаю... |
| `progress` | Sent: {sent} / {total} | Отправлено: {sent} / {total} |
| `cooldown` | Next campaign available in {days} d | Следующая рассылка через {days} дн |
| `done` | Campaign complete | Рассылка завершена |
| `noResume` | Create your resume first | Сначала создай резюме |
| `noResumeLink` | Go to Resume | Перейти к резюме |
| `errorCooldown` | Cooldown active | Рассылка недоступна |
| `errorNoResume` | No resume found | Резюме не найдено |
| `managersTitle` | Employer Database | База работодателей |
| `addEmployer` | Add | Добавить |
| `importCsv` | Import CSV | Импорт CSV |
| `colCompany` | Company | Компания |
| `colEmail` | Email | Email |
| `colFleet` | Fleet | Флот |
| `totalCount` | {count} total | {count} записей |

---

## File Map

```
app/
  [locale]/
    dashboard/
      sender/
        page.tsx                  REPLACE stub — sender UI
        employers/
          page.tsx                NEW — admin employer management
  api/
    sender/
      process/
        route.ts                  NEW — queue processing cron
actions/
  sender.ts                       NEW — launchCampaign, translateCoverLetter
components/
  sender/
    campaign-progress.tsx         NEW — progress bar (client, polls every 10s)
    employer-table.tsx            NEW — paginated employer list (admin)
    cover-letter-field.tsx        NEW — textarea + AI translate button (client)
    fleet-filter.tsx              NEW — fleet type selector chips (client)
    recipient-list.tsx            NEW — collapsible checklist (client)
  dashboard/
    analytics-widget.tsx          MODIFY — real data from send_campaigns
scripts/
  import-employers.ts             NEW — one-time CSV→Supabase import
messages/
  en.json                         EXTEND — add sender namespace
  ru.json                         EXTEND — add sender namespace
vercel.json                       EXTEND — add sender/process cron
```

---

## Environment Variables

| Var | Purpose |
|-----|---------|
| `ANTHROPIC_API_KEY` | Claude Haiku for cover letter translation |
| `ADMIN_EMAIL` | Email address that gets employer management access |
| `CRON_SECRET` | Already exists — reused for sender/process route |
| `RESEND_FROM_EMAIL` | Already exists — reused for sender emails |

---

## Out of Scope (this phase)

- Per-user employer lists
- Email open/click tracking
- Unsubscribe handling
- Content management (landing page texts, ads) — separate spec later
- Gmail import integration — external script only
