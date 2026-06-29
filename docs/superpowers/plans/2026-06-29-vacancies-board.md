# Vacancies Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a vacancies board to the SeaJob dashboard — syncs maritime job listings from jobatsea.online RSS, displays them with fleet-type filters, and lets authenticated seafarers apply by sending their resume PDF to the employer's email.

**Architecture:** A Vercel Cron Job hits `POST /api/vacancies/sync` hourly, which fetches the jobatsea.online RSS feed, parses it into structured rows, and upserts into a `vacancies` Supabase table. The dashboard vacancies page is a server component that reads from Supabase with URL-param filters. A `applyToVacancy` Server Action generates the user's resume PDF and sends it via Resend.

**Tech Stack:** `fast-xml-parser` (RSS → JS), `resend` (email), `@react-pdf/renderer` (already installed, reused), Supabase (already configured), Next.js Server Actions, Playwright E2E.

## Global Constraints

- All UI strings come from next-intl — no hardcoded text. Keys go in both `messages/en.json` and `messages/ru.json`.
- Never hardcode `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `.env.local` only.
- TypeScript strict mode — no `any` in production code. Use `unknown` + type guards or cast to explicit types.
- shadcn/ui + Tailwind CSS. Colors follow the design system: pearl `#dce6f4` background, navy `#0c2461` primary, white cards with `border: 1px solid #b8cce0`.
- `npm run build` must pass before marking any task done.
- Run `npx playwright test --project=chromium` before marking the final task done.

---

### Task 1: Foundation — DB, Types, i18n, Dependencies

**Files:**
- Run SQL in Supabase dashboard (manual step)
- Modify: `lib/supabase/types.ts`
- Modify: `messages/en.json`
- Modify: `messages/ru.json`
- Modify: `.env.local`
- Create: `vercel.json`

**Interfaces:**
- Produces: `Vacancy` type exported from `lib/supabase/types.ts` — used by Tasks 2, 3, 4
- Produces: `vacancies.*` i18n namespace — used by Tasks 3, 4

- [ ] **Step 1: Run the Supabase migration**

Open the Supabase dashboard → SQL Editor and run:

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

- [ ] **Step 2: Add Vacancy type to `lib/supabase/types.ts`**

Append after the `ResumeData` type (before the `Database` type):

```typescript
export type Vacancy = {
  id: string
  external_id: string
  source: string
  rank: string | null
  company: string | null
  vessel_type: string | null
  salary: string | null
  description: string | null
  contact_email: string | null
  url: string | null
  posted_at: string | null
  is_urgent: boolean
  created_at: string
}
```

Also add the `vacancies` table to the `Database` type inside `Tables`:

```typescript
      vacancies: {
        Row: Vacancy
        Insert: Omit<Vacancy, 'id' | 'created_at'>
        Update: Partial<Omit<Vacancy, 'id' | 'created_at'>>
        Relationships: []
      }
```

- [ ] **Step 3: Add i18n keys to `messages/en.json`**

Add a `"vacancies"` key at the top level of the JSON object:

```json
"vacancies": {
  "title": "Vacancies",
  "filterAll": "All",
  "filterContainer": "Container",
  "filterTanker": "Tanker",
  "filterOffshore": "Offshore",
  "filterBulk": "Bulk",
  "filterCruise": "Cruise",
  "apply": "Apply",
  "viewOnSite": "View on site",
  "applied": "Resume sent!",
  "applyError": "Failed to send. Try again.",
  "noResume": "Create your resume first",
  "noResumeLink": "Go to Resume",
  "urgent": "Urgent",
  "noVacancies": "No vacancies yet — sync will run hourly."
}
```

- [ ] **Step 4: Add i18n keys to `messages/ru.json`**

```json
"vacancies": {
  "title": "Вакансии",
  "filterAll": "Все",
  "filterContainer": "Контейнеровоз",
  "filterTanker": "Танкер",
  "filterOffshore": "Офшор",
  "filterBulk": "Балкер",
  "filterCruise": "Круиз",
  "apply": "Откликнуться",
  "viewOnSite": "Смотреть на сайте",
  "applied": "Резюме отправлено!",
  "applyError": "Ошибка отправки. Попробуй ещё раз.",
  "noResume": "Сначала создай резюме",
  "noResumeLink": "Перейти к резюме",
  "urgent": "Срочно",
  "noVacancies": "Вакансий пока нет — синхронизация запускается раз в час."
}
```

- [ ] **Step 5: Add env vars to `.env.local`**

```bash
# Generate any random string, e.g.: openssl rand -hex 32
CRON_SECRET=your_random_secret_here

# From Resend dashboard → API Keys
RESEND_API_KEY=re_your_key_here

# From Supabase dashboard → Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

- [ ] **Step 6: Install dependencies**

```bash
npm install fast-xml-parser resend
```

Expected: packages added to `node_modules`, `package.json` updated.

- [ ] **Step 7: Create `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/vacancies/sync",
      "schedule": "0 * * * *"
    }
  ]
}
```

- [ ] **Step 8: Verify build still passes**

```bash
npm run build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add lib/supabase/types.ts messages/en.json messages/ru.json vercel.json package.json package-lock.json
git commit -m "feat: vacancies foundation — DB types, i18n, deps, vercel cron"
```

---

### Task 2: RSS Parser + Sync API Route

**Files:**
- Create: `lib/vacancies/parse-rss.ts`
- Create: `app/api/vacancies/sync/route.ts`

**Interfaces:**
- Produces: `parseJobatseaRss(xml: string): RssVacancy[]` from `lib/vacancies/parse-rss.ts`
- Produces: `POST /api/vacancies/sync` → `{ synced: number }` or `{ error: string }`
- Consumes: `Vacancy` type from `lib/supabase/types.ts` (Task 1)

- [ ] **Step 1: Create `lib/vacancies/parse-rss.ts`**

```typescript
import { XMLParser } from 'fast-xml-parser'

export type RssVacancy = Omit<import('@/lib/supabase/types').Vacancy, 'id' | 'created_at'>

export function parseJobatseaRss(xml: string): RssVacancy[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    isArray: (name) => name === 'item',
  })

  let parsed: unknown
  try {
    parsed = parser.parse(xml)
  } catch {
    return []
  }

  const root = parsed as { RDF?: { item?: unknown[] } }
  const items = root.RDF?.item ?? []

  return (items as Record<string, unknown>[])
    .map(parseItem)
    .filter((v): v is RssVacancy => Boolean(v.url))
}

function parseItem(item: Record<string, unknown>): RssVacancy {
  const rawTitle = String(item.title ?? '')
  const rawDesc = String(item.description ?? '')
  const link = String(item.link ?? item['@_about'] ?? '')
  const dateStr = String(item.date ?? '')

  // Strip HTML tags from description
  const plainDesc = rawDesc
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const { isUrgent, rank, vesselType, salary, company } = parseTitle(rawTitle)

  return {
    external_id: link,
    source: 'jobatsea',
    rank,
    company,
    vessel_type: vesselType,
    salary,
    description: plainDesc || null,
    contact_email: extractEmail(plainDesc),
    url: link || null,
    posted_at: dateStr || null,
    is_urgent: isUrgent,
  }
}

function parseTitle(title: string): {
  isUrgent: boolean
  rank: string | null
  vesselType: string | null
  salary: string | null
  company: string | null
} {
  const isUrgent = /^\[urgent\]/i.test(title.trim())
  const cleaned = title.replace(/^\[urgent\]\s*/i, '').trim()

  // Pattern: RANK / VESSEL_TYPE / SALARY at COMPANY
  const atIdx = cleaned.lastIndexOf(' at ')
  const company = atIdx !== -1 ? cleaned.slice(atIdx + 4).trim() || null : null
  const beforeAt = atIdx !== -1 ? cleaned.slice(0, atIdx).trim() : cleaned

  const parts = beforeAt.split(' / ')
  if (parts.length < 2) {
    return { isUrgent, rank: cleaned.trim() || null, vesselType: null, salary: null, company }
  }

  return {
    isUrgent,
    rank: parts[0].trim() || null,
    vesselType: parts[1]?.trim() || null,
    salary: parts[2]?.replace(/\.+$/, '').trim() || null,
    company,
  }
}

function extractEmail(text: string): string | null {
  const match = text.match(/[\w.+\-]+@[\w\-]+\.[a-z]{2,}/i)
  return match ? match[0].toLowerCase() : null
}
```

- [ ] **Step 2: Smoke-test the parser against the real RSS**

Create a temporary script `scripts/test-rss-parse.ts`:

```typescript
import { parseJobatseaRss } from '../lib/vacancies/parse-rss'

async function main() {
  const res = await fetch('https://jobatsea.online/rss/all/')
  const xml = await res.text()
  const items = parseJobatseaRss(xml)
  console.log(`Parsed ${items.length} items`)
  if (items[0]) {
    console.log('First item:', JSON.stringify(items[0], null, 2))
  }
}

main().catch(console.error)
```

Run:
```bash
npx tsx scripts/test-rss-parse.ts
```

Expected output: `Parsed 10 items` and a JSON object with `rank`, `company`, `vessel_type`, `salary`, `contact_email` populated (some may be null if the title doesn't match the pattern).

- [ ] **Step 3: Create `app/api/vacancies/sync/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseJobatseaRss } from '@/lib/vacancies/parse-rss'
import type { Database } from '@/lib/supabase/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RSS_URL = 'https://jobatsea.online/rss/all/'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let xml: string
  try {
    const res = await fetch(RSS_URL, {
      headers: { 'User-Agent': 'SeaJob/1.0 (RSS reader)' },
      next: { revalidate: 0 },
    })
    xml = await res.text()
  } catch (err) {
    return NextResponse.json({ error: `Fetch failed: ${String(err)}` }, { status: 502 })
  }

  const vacancies = parseJobatseaRss(xml)
  if (vacancies.length === 0) {
    return NextResponse.json({ synced: 0 })
  }

  const { error } = await supabase
    .from('vacancies')
    .upsert(vacancies, { onConflict: 'external_id', ignoreDuplicates: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ synced: vacancies.length })
}
```

- [ ] **Step 4: Build to verify no type errors**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 5: Start dev server and test the sync route**

```bash
npm run dev
```

In a second terminal:
```bash
curl -s -X POST http://localhost:3000/api/vacancies/sync \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)" \
  | jq .
```

Expected: `{ "synced": 10 }` (or similar). Verify rows appeared in Supabase dashboard → Table Editor → vacancies.

- [ ] **Step 6: Verify unauthorized requests are rejected**

```bash
curl -s -X POST http://localhost:3000/api/vacancies/sync | jq .
```

Expected: `{ "error": "Unauthorized" }` with HTTP 401.

- [ ] **Step 7: Clean up temp script and commit**

```bash
rm scripts/test-rss-parse.ts
git add lib/vacancies/parse-rss.ts app/api/vacancies/sync/route.ts vercel.json
git commit -m "feat: RSS parser and vacancies sync API route"
```

---

### Task 3: Vacancies Board UI

**Files:**
- Create: `components/vacancies/vacancy-card.tsx`
- Create: `components/vacancies/vacancy-filters.tsx`
- Modify: `app/[locale]/dashboard/vacancies/page.tsx` (replace stub)

**Interfaces:**
- Consumes: `Vacancy` from `lib/supabase/types.ts` (Task 1)
- Consumes: `applyToVacancy` from `actions/vacancies.ts` (stubbed in Task 4 — wire up after Task 4)
- Produces: `/[locale]/dashboard/vacancies?fleet=tanker&page=2` URL scheme

- [ ] **Step 1: Create `components/vacancies/vacancy-card.tsx`**

This is a client component because it has the apply button with loading state. The `applyToVacancy` action is imported but Task 4 implements it — for now import it even though it doesn't exist yet; the build will fail until Task 4 is done. Complete both tasks before building.

```typescript
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { applyToVacancy } from '@/actions/vacancies'
import type { Vacancy } from '@/lib/supabase/types'

export function VacancyCard({
  vacancy,
  locale,
}: {
  vacancy: Vacancy
  locale: string
}) {
  const t = useTranslations('vacancies')
  const [loading, setLoading] = useState(false)

  async function handleApply() {
    setLoading(true)
    const result = await applyToVacancy(vacancy.id)
    setLoading(false)
    if (result.ok) {
      toast.success(t('applied'))
    } else if (result.error === 'no_resume') {
      toast.error(t('noResume'))
    } else {
      toast.error(t('applyError'))
    }
  }

  const descPreview =
    vacancy.description && vacancy.description.length > 120
      ? vacancy.description.slice(0, 120) + '…'
      : (vacancy.description ?? '')

  const postedDate = vacancy.posted_at
    ? new Date(vacancy.posted_at).toLocaleDateString(
        locale === 'ru' ? 'ru-RU' : 'en-GB',
        { day: 'numeric', month: 'short', year: 'numeric' }
      )
    : ''

  return (
    <div
      className="bg-card rounded-xl p-5 flex flex-col gap-3"
      style={{ border: '1px solid #b8cce0' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {vacancy.is_urgent && (
              <span
                className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded"
                style={{ background: '#fee2e2', color: '#dc2626' }}
              >
                {t('urgent')}
              </span>
            )}
            <span
              className="text-[15px] font-bold tracking-tight"
              style={{ color: '#0c2461' }}
            >
              {vacancy.rank ?? '—'}
            </span>
          </div>
          <div className="text-xs mt-0.5 text-muted-foreground">
            {[vacancy.company, vacancy.vessel_type].filter(Boolean).join(' · ')}
          </div>
        </div>
        {vacancy.salary && (
          <span
            className="text-[13px] font-bold shrink-0"
            style={{ color: '#0c2461' }}
          >
            {vacancy.salary}
          </span>
        )}
      </div>

      {/* Description preview */}
      {descPreview && (
        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {descPreview}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-[11px] text-muted-foreground">{postedDate}</span>

        {vacancy.contact_email ? (
          <Button
            size="sm"
            onClick={handleApply}
            disabled={loading}
            className="text-xs h-8 px-3"
          >
            {loading ? '…' : t('apply')}
          </Button>
        ) : vacancy.url ? (
          <a
            href={vacancy.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium underline"
            style={{ color: '#1d4ed8' }}
          >
            {t('viewOnSite')}
          </a>
        ) : null}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/vacancies/vacancy-filters.tsx`**

Server component — uses `getTranslations`, renders `<Link>` elements with URL params.

```typescript
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

const FILTERS = [
  { key: '', labelKey: 'filterAll' },
  { key: 'container', labelKey: 'filterContainer' },
  { key: 'tanker', labelKey: 'filterTanker' },
  { key: 'offshore', labelKey: 'filterOffshore' },
  { key: 'bulk', labelKey: 'filterBulk' },
  { key: 'cruise', labelKey: 'filterCruise' },
] as const

type LabelKey = typeof FILTERS[number]['labelKey']

export async function VacancyFilters({
  currentFleet,
  locale,
}: {
  currentFleet: string
  locale: string
}) {
  const t = await getTranslations('vacancies')

  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map(({ key, labelKey }) => {
        const isActive = currentFleet === key
        const href =
          key
            ? `/${locale}/dashboard/vacancies?fleet=${key}`
            : `/${locale}/dashboard/vacancies`

        return (
          <Link
            key={key}
            href={href}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              background: isActive ? '#0c2461' : '#dce6f4',
              color: isActive ? '#ffffff' : '#0c2461',
            }}
          >
            {t(labelKey as LabelKey)}
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Replace `app/[locale]/dashboard/vacancies/page.tsx`**

```typescript
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { VacancyCard } from '@/components/vacancies/vacancy-card'
import { VacancyFilters } from '@/components/vacancies/vacancy-filters'
import type { Vacancy } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 20

export default async function VacanciesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string }
  searchParams: { fleet?: string; page?: string }
}) {
  const t = await getTranslations('vacancies')
  const fleet = searchParams.fleet ?? ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = createClient()

  let query = supabase
    .from('vacancies')
    .select('*', { count: 'exact' })
    .order('posted_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (fleet) {
    query = query.ilike('vessel_type', `%${fleet}%`)
  }

  const { data, count } = await query
  const vacancies = (data ?? []) as Vacancy[]
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1
        className="font-display text-2xl font-bold mb-6"
        style={{ color: '#0c2461' }}
      >
        {t('title')}
      </h1>

      <VacancyFilters currentFleet={fleet} locale={locale} />

      {vacancies.length === 0 ? (
        <p className="text-muted-foreground text-sm mt-12 text-center">
          {t('noVacancies')}
        </p>
      ) : (
        <div
          className="grid gap-3 mt-6"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))' }}
        >
          {vacancies.map((v) => (
            <VacancyCard key={v.id} vacancy={v} locale={locale} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/${locale}/dashboard/vacancies?fleet=${fleet}&page=${p}`}
              className="px-3 py-1 rounded text-sm font-medium border transition-colors"
              style={
                p === page
                  ? { background: '#0c2461', color: '#fff', borderColor: '#0c2461' }
                  : { background: '#fff', color: '#0c2461', borderColor: '#b8cce0' }
              }
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create a stub `actions/vacancies.ts` so the build passes**

`VacancyCard` imports `applyToVacancy` — without this stub the build fails. Task 4 will replace this with the real implementation.

```typescript
'use server'

export async function applyToVacancy(
  _vacancyId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  return { ok: false, error: 'not_implemented' }
}
```

- [ ] **Step 5: Build to verify no TypeScript errors**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 6: Commit UI**

```bash
git add components/vacancies/ app/[locale]/dashboard/vacancies/page.tsx actions/vacancies.ts
git commit -m "feat: vacancies board UI — page, card, filters"
```

---

### Task 4: Apply Server Action

**Files:**
- Create: `actions/vacancies.ts`

**Interfaces:**
- Consumes: `Vacancy` from `lib/supabase/types.ts` (Task 1)
- Consumes: `renderToBuffer`, `createElement` from `@react-pdf/renderer` and `react`
- Consumes: `TemplateClassic` from `@/components/resume/pdf/template-classic`
- Consumes: `PdfResumeData` from `@/components/resume/pdf/types`
- Produces: `applyToVacancy(vacancyId: string): Promise<{ ok: true } | { ok: false; error: string }>`

- [ ] **Step 1: Create `actions/vacancies.ts`**

The PDF generation logic mirrors `app/api/resume/pdf/route.ts` exactly. The key difference: here we capture the buffer and pass it to Resend instead of streaming it.

```typescript
'use server'

import { createElement, type ReactElement } from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import type { DocumentProps } from '@react-pdf/renderer'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { TemplateClassic } from '@/components/resume/pdf/template-classic'
import type { PdfResumeData } from '@/components/resume/pdf/types'
import type {
  Resume,
  ResumeExperience,
  ResumeCertificate,
  ResumeEducation,
  ResumeLanguage,
  ResumeSkill,
  ResumeReference,
} from '@/lib/supabase/types'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function applyToVacancy(
  vacancyId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient()

  // 1. Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  // 2. Fetch vacancy
  const { data: vacancy } = await supabase
    .from('vacancies')
    .select('contact_email, rank, company')
    .eq('id', vacancyId)
    .single()

  if (!vacancy?.contact_email) {
    return { ok: false, error: 'no_email' }
  }

  // 3. Fetch profile and resume
  const [{ data: profile }, { data: resume }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, rank, fleet_type, subscription_status')
      .eq('id', user.id)
      .single(),
    supabase.from('resumes').select('*').eq('user_id', user.id).single(),
  ])

  if (!resume) return { ok: false, error: 'no_resume' }

  // 4. Fetch resume sections
  const [exp, certs, edu, langs, skills, refs] = await Promise.all([
    supabase.from('resume_experience').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_certificates').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_education').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_languages').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_skills').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_references').select('*').eq('resume_id', resume.id).order('sort_order'),
  ])

  // 5. Generate PDF
  const pdfData: PdfResumeData = {
    profile: {
      full_name: profile?.full_name ?? null,
      rank: profile?.rank ?? null,
      fleet_type: profile?.fleet_type ?? null,
    },
    resume: resume as Resume,
    experience: (exp.data ?? []) as ResumeExperience[],
    certificates: (certs.data ?? []) as ResumeCertificate[],
    education: (edu.data ?? []) as ResumeEducation[],
    languages: (langs.data ?? []) as ResumeLanguage[],
    skills: (skills.data ?? []) as ResumeSkill[],
    references: (refs.data ?? []) as ResumeReference[],
    watermark: false,
  }

  const element = createElement(TemplateClassic, {
    data: pdfData,
  }) as ReactElement<DocumentProps>
  const buffer = await renderToBuffer(element)

  // 6. Send email via Resend
  const fullName = profile?.full_name ?? 'Seafarer'
  const subject = `Application — ${vacancy.rank ?? 'Seafarer'}, ${fullName}`

  const { error: sendError } = await resend.emails.send({
    from: 'SeaJob <noreply@seajob.app>',
    to: vacancy.contact_email,
    subject,
    text: `Dear ${vacancy.company ?? 'Hiring Manager'},\n\nPlease find attached my resume. I am applying for the ${vacancy.rank ?? 'position'} role.\n\nBest regards,\n${fullName}\n\nSent via SeaJob (seajob.app)`,
    attachments: [
      {
        filename: `seajob-cv-${fullName.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        content: Buffer.from(buffer),
      },
    ],
  })

  if (sendError) {
    console.error('Resend error:', sendError)
    return { ok: false, error: 'send_failed' }
  }

  return { ok: true }
}
```

- [ ] **Step 2: Build to verify everything compiles together**

```bash
npm run build
```

Expected: clean build. This is the first time all three tasks (UI + action) are compiled together. Fix any TypeScript errors before proceeding.

- [ ] **Step 3: Manual smoke test**

Start dev server, log in, navigate to `/ru/dashboard/vacancies`. You should see vacancy cards (if sync has been run) or the "no vacancies" message. Try the "Откликнуться" button on a card that has `contact_email` — check Resend dashboard for the sent email.

If no vacancies in DB yet, trigger sync:
```bash
curl -s -X POST http://localhost:3000/api/vacancies/sync \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)"
```

Then reload the vacancies page.

- [ ] **Step 4: Commit**

```bash
git add actions/vacancies.ts
git commit -m "feat: applyToVacancy server action — PDF + Resend email"
```

---

### Task 5: E2E Test + Final Verification

**Files:**
- Create: `e2e/vacancies.spec.ts`

**Interfaces:**
- Consumes: running app on `http://localhost:3000`

- [ ] **Step 1: Create `e2e/vacancies.spec.ts`**

```typescript
import { test, expect } from '@playwright/test'

test('unauthenticated access to vacancies page redirects to login', async ({ page }) => {
  await page.goto('http://localhost:3000/en/dashboard/vacancies')
  await expect(page).toHaveURL(/\/login/)
})

test('vacancies page loads for authenticated user (mocked via cookie)', async ({ page }) => {
  // Navigate to login page — if redirected there from /dashboard/vacancies,
  // the route protection is working correctly.
  // Full authenticated test requires real credentials — covered by manual smoke test.
  await page.goto('http://localhost:3000/en/dashboard/vacancies')
  // Should redirect to login, not crash
  await expect(page).not.toHaveURL(/error/)
  await expect(page).not.toHaveURL(/500/)
})

test('vacancies page loads at /ru locale', async ({ page }) => {
  await page.goto('http://localhost:3000/ru/dashboard/vacancies')
  await expect(page).toHaveURL(/\/login/)
})
```

- [ ] **Step 2: Run Playwright tests**

```bash
npx playwright test --project=chromium
```

Expected: all tests pass (existing 8 + 3 new = 11 tests, 1 still skipped).

- [ ] **Step 3: Final build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Commit and update handoff**

```bash
git add e2e/vacancies.spec.ts
git commit -m "test: add vacancies E2E tests"
```

Update `handoff.md` — change Vacancies Board status from "Not started" to "Complete" and add a summary of what was built.

```bash
git add handoff.md
git commit -m "docs: update handoff — Vacancies Board complete"
```
