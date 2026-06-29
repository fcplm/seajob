# SeaJob — Resume Builder Design Spec

**Date:** 2026-06-28
**Phase:** 2 — Resume Builder
**Status:** Approved

---

## Overview

A comprehensive seafarer resume builder living at `/[locale]/dashboard/resume`. Users fill in structured sections via an accordion UI with per-section save buttons. Completed resumes can be downloaded as a PDF in up to 3 templates, gated by subscription tier.

---

## Database Schema

All tables use Supabase RLS: users can only read/write rows belonging to their own resume.

```sql
-- One resume per user
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users unique not null,
  bio text,
  availability_date date,
  contract_duration text,       -- e.g. "4-6 months"
  salary_expectation text,      -- free text, e.g. "$3,500/month"
  template text not null default 'classic', -- 'classic' | 'modern' | 'compact'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table resumes enable row level security;
create policy "Users manage own resume" on resumes
  for all using (auth.uid() = user_id);

-- Sea experience (vessel-level records)
create table resume_experience (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  vessel_name text,
  vessel_type text,             -- bulk carrier, tanker, FPSO, container, etc.
  grt int,
  dwt int,
  flag text,
  company text,
  position text,
  started_at date,
  ended_at date,                -- null = current position
  sort_order int not null default 0
);
alter table resume_experience enable row level security;
create policy "Users manage own experience" on resume_experience
  for all using (
    auth.uid() = (select user_id from resumes where id = resume_id)
  );

-- Certificates (STCW and other)
create table resume_certificates (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  name text,
  issued_by text,
  issued_at date,
  expires_at date,              -- null = no expiry
  sort_order int not null default 0
);
alter table resume_certificates enable row level security;
create policy "Users manage own certificates" on resume_certificates
  for all using (
    auth.uid() = (select user_id from resumes where id = resume_id)
  );

-- Education
create table resume_education (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  institution text,
  degree text,
  field text,
  started_at date,
  ended_at date,
  sort_order int not null default 0
);
alter table resume_education enable row level security;
create policy "Users manage own education" on resume_education
  for all using (
    auth.uid() = (select user_id from resumes where id = resume_id)
  );

-- Languages
create table resume_languages (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  language text,
  level text,                   -- A1 | A2 | B1 | B2 | C1 | C2 | Native
  sort_order int not null default 0
);
alter table resume_languages enable row level security;
create policy "Users manage own languages" on resume_languages
  for all using (
    auth.uid() = (select user_id from resumes where id = resume_id)
  );

-- Skills / endorsements
create table resume_skills (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  name text,
  sort_order int not null default 0
);
alter table resume_skills enable row level security;
create policy "Users manage own skills" on resume_skills
  for all using (
    auth.uid() = (select user_id from resumes where id = resume_id)
  );

-- References
create table resume_references (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  full_name text,
  position text,
  company text,
  email text,
  phone text,
  sort_order int not null default 0
);
alter table resume_references enable row level security;
create policy "Users manage own references" on resume_references
  for all using (
    auth.uid() = (select user_id from resumes where id = resume_id)
  );
```

The `profiles` table (from Foundation) supplies `full_name`, `rank`, `fleet_type`, and `photo_url` — these are read by the PDF renderer but not duplicated into `resumes`.

---

## UI — Accordion Layout

**Route:** `app/[locale]/dashboard/resume/page.tsx`

Replaces the existing "coming soon" placeholder.

**Page structure:**
1. **Top bar** — resume completeness progress bar (0–100% based on filled sections), "Download PDF" button (right-aligned, disabled until at least one section is saved)
2. **Template picker** — 3 thumbnail previews (`classic`, `modern`, `compact`); `modern` and `compact` show a padlock + "Pro" badge for Free users
3. **Accordion** — 8 sections, collapsed by default, one open at a time

**Accordion sections (in order):**

| # | Label | Fields |
|---|-------|--------|
| 1 | Personal Info | Bio (textarea) |
| 2 | Sea Experience | List of vessel entries — vessel name, vessel type, GRT, DWT, flag, company, position, start date, end date (nullable) |
| 3 | Certificates | List — name, issued by, issue date, expiry date (nullable) |
| 4 | Education | List — institution, degree, field, start date, end date |
| 5 | Languages | List — language, level (A1–C2 / Native) |
| 6 | Skills | List — skill/endorsement name (tag-style) |
| 7 | References | List — full name, position, company, email, phone |
| 8 | Preferences | Availability date, contract duration, salary expectation |

**List section pattern:** existing entries rendered as cards with Edit and Delete icon buttons. "Add entry" button at the bottom opens an inline form within the accordion. Each section has an explicit "Save" button; a "Saved ✓" confirmation appears inline on success.

**Completeness score:** each section contributes equally (12.5% each). A section is "complete" if it has at least one saved entry (list sections), a non-empty bio (Personal Info), or at least one non-empty field (Preferences).

---

## PDF Export

**Route Handler:** `GET /api/resume/pdf?template=classic`

**Templates:**

| ID | Style |
|----|-------|
| `classic` | Two-column, serif headings — traditional maritime CV look |
| `modern` | Single-column, bold section dividers, sans-serif |
| `compact` | Dense single-column, smaller font — fits more content per page |

**Subscription gating:**
- Free: `classic` only, SeaJob watermark in the footer of each page
- Pro/Enterprise: all 3 templates, no watermark

**Locking UI:** clicking a locked template thumbnail shows a toast: "Upgrade to Pro to unlock all templates."

**Generation flow:**
1. Server reads full resume + all sub-table rows from Supabase
2. Reads `profiles` row for name, rank, fleet type, photo
3. Checks `profiles.subscription_status`; applies watermark if `free`
4. Renders via `@react-pdf/renderer` React component → PDF buffer
5. Streams response as `application/pdf` with `Content-Disposition: attachment; filename="seajob-cv-[full_name]-[YYYY-MM].pdf"`

**Error cases:**
- No resume exists → 400: "Complete at least one section before downloading"
- Render failure → 500: toast "Failed to generate PDF. Please try again."
- Locked template requested by Free user → 403: redirect to template picker with upgrade toast

---

## Data Flow

**Page load (`dashboard/resume/page.tsx` — server component):**

1. Fetch `resumes` row by `user_id`. If null (new user), pass empty initial data to `<ResumeEditor>` — no sub-table fetches needed.
2. If resume exists, fetch all sub-tables in parallel:
```
Promise.all([
  supabase.from('resume_experience').select('*').eq('resume_id', resumeId).order('sort_order'),
  supabase.from('resume_certificates').select('*').eq('resume_id', resumeId).order('sort_order'),
  supabase.from('resume_education').select('*').eq('resume_id', resumeId).order('sort_order'),
  supabase.from('resume_languages').select('*').eq('resume_id', resumeId).order('sort_order'),
  supabase.from('resume_skills').select('*').eq('resume_id', resumeId).order('sort_order'),
  supabase.from('resume_references').select('*').eq('resume_id', resumeId).order('sort_order'),
])
```

Props passed to `<ResumeEditor>` client component which owns accordion open/close state.

**Server Actions (`actions/resume.ts`):**

| Action | Description |
|--------|-------------|
| `upsertResumeMeta(data)` | Creates resume row on first save; updates bio/preferences thereafter |
| `addResumeEntry(table, data)` | Inserts a new list entry |
| `updateResumeEntry(table, id, data)` | Updates an existing list entry |
| `deleteResumeEntry(table, id)` | Deletes a list entry |

All actions validate the user session server-side before writing. The `resumes` row is created lazily on first `upsertResumeMeta` call.

---

## Key Files

```
app/
  [locale]/dashboard/resume/
    page.tsx                        — server component, fetches all resume data
  api/resume/
    pdf/route.ts                    — GET handler, generates and streams PDF

actions/
  resume.ts                         — all resume server actions

components/
  resume/
    resume-editor.tsx               — client component, accordion controller
    section-personal.tsx            — bio section
    section-experience.tsx          — vessel list section
    section-certificates.tsx
    section-education.tsx
    section-languages.tsx
    section-skills.tsx
    section-references.tsx
    section-preferences.tsx
    template-picker.tsx             — 3 thumbnails with lock UI
    completeness-bar.tsx            — progress bar
    pdf/
      template-classic.tsx          — @react-pdf/renderer component
      template-modern.tsx
      template-compact.tsx

lib/supabase/
  types.ts                          — extended with new table types
```

---

## i18n

All UI strings added to `messages/en.json` and `messages/ru.json` under a `resume` key. No hardcoded English text in components.

---

## Testing

**E2E (Playwright, Chromium):**
1. Fill Personal Info section → save → reload → assert bio persists
2. Add a sea experience entry → save → assert it appears in the list
3. Click "Download PDF" → assert file download is triggered
4. Free user clicks locked template → assert upgrade toast appears

**Build:** `npm run build` must pass. `npx playwright test --project=chromium` must pass.
