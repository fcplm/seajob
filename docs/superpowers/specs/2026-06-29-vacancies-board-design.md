# Vacancies Board — Design Spec

**Date:** 2026-06-29  
**Status:** Approved

---

## Overview

A vacancies board for seafarers inside the SeaJob dashboard. Pulls job listings from external maritime job boards via RSS, stores them in Supabase, and lets authenticated users apply with one click — SeaJob sends their built resume as a PDF to the employer's email via Resend.

---

## Scope

- RSS sync from jobatsea.online only (maritime-zone.com blocked by Cloudflare — deferred)
- One-click apply via email (Resend) with resume PDF attached
- Read-only board for seafarers (no employer-side posting in this phase)
- Telegram channel parsing: deferred to a later phase

---

## Data Model

### New table: `vacancies`

```sql
create table vacancies (
  id            uuid primary key default gen_random_uuid(),
  external_id   text unique not null,        -- URL from RSS, used for dedup
  source        text not null,               -- 'jobatsea'
  rank          text,                        -- parsed: 'Bosun', 'Chief Engineer'
  company       text,                        -- parsed: 'Amergo Group'
  vessel_type   text,                        -- parsed: 'Container', 'Tanker', 'Offshore'
  salary        text,                        -- parsed: '1990-2100 USD'
  description   text,                        -- full RSS description text
  contact_email text,                        -- regex-extracted from description (nullable)
  url           text,                        -- original posting URL (fallback)
  posted_at     timestamptz,
  is_urgent     boolean not null default false,
  created_at    timestamptz default now()
);

alter table vacancies enable row level security;

-- All authenticated users can read
create policy "Authenticated users read vacancies"
  on vacancies for select
  using (auth.role() = 'authenticated');

-- Only service role can insert/update (cron)
```

RLS allows all authenticated users to read. Writes happen only via the sync API route using the service role key.

---

## Parsing Logic

**RSS source:** `https://jobatsea.online/rss/all/`

**Title format:** `[Urgent] RANK / VESSEL_TYPE / SALARY at COMPANY`  
Example: `[Urgent] Bosun / Container Vessel / 1990-2100 USD.   at Amergo Group`

**Extraction rules:**

| Field | Rule |
|-------|------|
| `is_urgent` | Title starts with `[Urgent]` or `[URGENT]` |
| `rank` | First segment before first ` / ` (strip `[Urgent]` prefix) |
| `vessel_type` | Second segment between first and second ` / ` |
| `salary` | Third segment between second ` / ` and ` at ` |
| `company` | Text after ` at ` |
| `contact_email` | First email regex match in description: `/[\w.+-]+@[\w-]+\.[a-z]{2,}/i` |
| `external_id` | `<link>` value from RSS item |
| `url` | Same as `external_id` |
| `posted_at` | `<dc:date>` value |

Titles that don't match the `/` pattern fall back to: `rank = full title`, other fields `null`.

---

## Sync API Route

**File:** `app/api/vacancies/sync/route.ts`

- Method: `POST`
- Auth: requires `Authorization: Bearer $CRON_SECRET` header
- Logic:
  1. Fetch `https://jobatsea.online/rss/all/`
  2. Parse XML with Node's built-in `DOMParser` (or lightweight `fast-xml-parser`)
  3. Extract items with `fast-xml-parser` (npm package, Node.js compatible)
  4. Parse each item, upsert to Supabase on `external_id` conflict (update all fields except `created_at`)
- Returns: `{ synced: N }` JSON

**Vercel Cron** (`vercel.json`):
```json
{
  "crons": [{ "path": "/api/vacancies/sync", "schedule": "0 * * * *" }]
}
```

**New env var:** `CRON_SECRET` — added to `.env.local` and Vercel project settings.

---

## Apply Flow

**Server Action:** `actions/vacancies.ts` → `applyToVacancy(vacancyId: string)`

1. Verify user is authenticated (throw if not)
2. Fetch vacancy from Supabase; confirm `contact_email` is present
3. Fetch user's profile (`full_name`) and resume data from Supabase
4. Generate resume PDF: reuse `renderToBuffer` logic from `app/api/resume/pdf/route.ts`, template `classic`
5. Send email via Resend:
   - **To:** `contact_email`
   - **From:** `noreply@seajob.app` (or Resend onboarding domain for dev)
   - **Subject:** `Application — [rank], [full_name]`
   - **Body:** plain text: "Please find attached my resume. Sent via SeaJob."
   - **Attachment:** `resume.pdf` (buffer from step 4)
6. Return `{ ok: true }` or `{ error: string }`

**UI feedback:** success toast "Резюме отправлено!" / error toast if Resend fails or resume missing.

**New env var:** `RESEND_API_KEY` — added to `.env.local` and Vercel project settings.

---

## Vacancies Board UI

**Route:** `app/[locale]/dashboard/vacancies/page.tsx` (replaces current stub)

### Layout

```
[ Filter bar: All | Container | Tanker | Offshore | Bulk | Cruise ]

[ VacancyCard ] [ VacancyCard ]
[ VacancyCard ] [ VacancyCard ]
...
[ Pagination: < 1 2 3 > ]
```

Two-column grid on desktop, single column on mobile.

### VacancyCard (`components/vacancies/vacancy-card.tsx`)

```
┌─────────────────────────────────────────┐
│ [URGENT]  Chief Engineer    Odfjell      │
│           Tanker            $10,500/mo   │
│                                          │
│  <description preview — 2 lines>         │
│                             29 Jun 2026  │
│                   [ Откликнуться ]        │
└─────────────────────────────────────────┘
```

- If `contact_email` present → "Откликнуться" button (triggers apply action)
- If no email, but `url` present → "Смотреть на сайте" link (external, `target="_blank"`)
- If neither → no action button

### Filter bar

URL query param `?fleet=container&page=1`. The server component reads `fleet` and adds a `.ilike('vessel_type', '%container%')` clause to the Supabase query. Selecting a filter resets to page 1. Filter chips: All / Container / Tanker / Offshore / Bulk / Cruise — rendered as `<Link>` elements pointing to the new URL.

### Pagination

Server-side. Query param `?page=N`. 20 vacancies per page. Supabase query: `.range(offset, offset+19).order('posted_at', { ascending: false })`.

### Empty / no-resume state

- If no vacancies in DB → show "Синхронизация ещё не запускалась" with a manual trigger button (admin only, or just for dev — calls `/api/vacancies/sync`)
- If user clicks apply and has no resume → show dialog "Сначала создай резюме" with link to `/dashboard/resume`

---

## i18n Keys

Add to `messages/en.json` and `messages/ru.json` under `"vacancies"` namespace:

| Key | EN | RU |
|-----|----|----|
| `title` | Vacancies | Вакансии |
| `filterAll` | All | Все |
| `filterContainer` | Container | Контейнеровоз |
| `filterTanker` | Tanker | Танкер |
| `filterOffshore` | Offshore | Офшор |
| `filterBulk` | Bulk | Балкер |
| `filterCruise` | Cruise | Круиз |
| `apply` | Apply | Откликнуться |
| `viewOnSite` | View on site | Смотреть на сайте |
| `applied` | Resume sent! | Резюме отправлено! |
| `applyError` | Failed to send | Ошибка отправки |
| `noResume` | Create your resume first | Сначала создай резюме |
| `urgent` | Urgent | Срочно |
| `noVacancies` | No vacancies yet | Вакансий пока нет |
| `page` | Page | Страница |

---

## File Map

```
app/
  api/
    vacancies/
      sync/route.ts           NEW — RSS fetch + Supabase upsert
  [locale]/
    dashboard/
      vacancies/
        page.tsx              REPLACE stub — server component, reads from Supabase
actions/
  vacancies.ts                NEW — applyToVacancy server action
components/
  vacancies/
    vacancy-card.tsx          NEW — card UI + apply button
    vacancy-filters.tsx       NEW — filter chips (client component)
lib/
  vacancies/
    parse-rss.ts              NEW — XML parsing + field extraction
lib/supabase/
  types.ts                    EXTEND — add Vacancy type
messages/
  en.json                     EXTEND — add vacancies namespace
  ru.json                     EXTEND — add vacancies namespace
vercel.json                   CREATE or EXTEND — add cron entry
e2e/
  vacancies.spec.ts           NEW — unauthenticated redirect test
```

---

## Environment Variables

| Var | Purpose |
|-----|---------|
| `CRON_SECRET` | Protects `/api/vacancies/sync` from unauthorized calls |
| `RESEND_API_KEY` | Resend email sending |

Both go in `.env.local` and Vercel project environment settings.

---

## Out of Scope (this phase)

- Application tracking (no `applications` table)
- Employer-side vacancy posting
- Telegram channel parsing
- maritime-zone.com (Cloudflare-blocked)
- Saved/bookmarked vacancies
- Email template (plain text only)
