# Resume Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive seafarer resume builder at `/[locale]/dashboard/resume` with per-section accordion UI, server-side PDF export in 3 templates, and Free/Pro subscription gating.

**Architecture:** Structured Supabase tables (one per resume section) feed a server-component page that passes data to a client-side accordion editor. PDF generation runs in a Node.js Route Handler using `@react-pdf/renderer`.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind + shadcn/ui, next-intl v4, Supabase with RLS, @react-pdf/renderer, Playwright E2E.

## Global Constraints

- All UI strings in `messages/en.json` and `messages/ru.json` under the `resume` key — no hardcoded English text
- Never hardcode Supabase URL or anon key — `.env.local` only
- shadcn/ui Default style, Slate base color, Radix UI (not Base UI)
- Server actions pattern: `'use server'`, `createClient()` from `@/lib/supabase/server`, validate session with `getUser()` first
- Run `npm run build` and `npx playwright test --project=chromium` before marking done
- Follow existing file patterns: see `actions/auth.ts`, `app/[locale]/dashboard/page.tsx`

---

### Task 1: DB Types + i18n Strings

**Files:**
- Modify: `lib/supabase/types.ts`
- Modify: `messages/en.json`
- Modify: `messages/ru.json`

**Interfaces:**
- Produces: `Resume`, `ResumeExperience`, `ResumeCertificate`, `ResumeEducation`, `ResumeLanguage`, `ResumeSkill`, `ResumeReference`, `ResumeData` types — consumed by all later tasks

- [ ] **Step 1: Extend `lib/supabase/types.ts`**

Append after the existing `Database` export:

```ts
export type Resume = {
  id: string
  user_id: string
  bio: string | null
  availability_date: string | null
  contract_duration: string | null
  salary_expectation: string | null
  template: 'classic' | 'modern' | 'compact'
  created_at: string
  updated_at: string
}

export type ResumeExperience = {
  id: string
  resume_id: string
  vessel_name: string | null
  vessel_type: string | null
  grt: number | null
  dwt: number | null
  flag: string | null
  company: string | null
  position: string | null
  started_at: string | null
  ended_at: string | null
  sort_order: number
}

export type ResumeCertificate = {
  id: string
  resume_id: string
  name: string | null
  issued_by: string | null
  issued_at: string | null
  expires_at: string | null
  sort_order: number
}

export type ResumeEducation = {
  id: string
  resume_id: string
  institution: string | null
  degree: string | null
  field: string | null
  started_at: string | null
  ended_at: string | null
  sort_order: number
}

export type ResumeLanguage = {
  id: string
  resume_id: string
  language: string | null
  level: string | null
  sort_order: number
}

export type ResumeSkill = {
  id: string
  resume_id: string
  name: string | null
  sort_order: number
}

export type ResumeReference = {
  id: string
  resume_id: string
  full_name: string | null
  position: string | null
  company: string | null
  email: string | null
  phone: string | null
  sort_order: number
}

export type ResumeData = {
  resume: Resume | null
  experience: ResumeExperience[]
  certificates: ResumeCertificate[]
  education: ResumeEducation[]
  languages: ResumeLanguage[]
  skills: ResumeSkill[]
  references: ResumeReference[]
}
```

- [ ] **Step 2: Add `resume` key to `messages/en.json`**

Add before the closing `}` of the root object:

```json
  "resume": {
    "title": "My Resume",
    "completeness": "{percent}% complete",
    "downloadPdf": "Download PDF",
    "templateClassic": "Classic",
    "templateModern": "Modern",
    "templateCompact": "Compact",
    "templateProRequired": "Upgrade to Pro to unlock all templates.",
    "sectionPersonal": "Personal Info",
    "sectionExperience": "Sea Experience",
    "sectionCertificates": "Certificates",
    "sectionEducation": "Education",
    "sectionLanguages": "Languages",
    "sectionSkills": "Skills",
    "sectionReferences": "References",
    "sectionPreferences": "Preferences",
    "save": "Save",
    "saving": "Saving...",
    "saved": "Saved ✓",
    "saveError": "Failed to save. Please try again.",
    "addEntry": "Add entry",
    "edit": "Edit",
    "delete": "Delete",
    "cancel": "Cancel",
    "noEntries": "No entries yet.",
    "bio": "Bio",
    "vesselName": "Vessel Name",
    "vesselType": "Vessel Type",
    "grt": "GRT",
    "dwt": "DWT",
    "flag": "Flag",
    "company": "Company",
    "position": "Position",
    "startDate": "Start Date",
    "endDate": "End Date",
    "current": "Present",
    "certName": "Certificate Name",
    "issuedBy": "Issued By",
    "issuedAt": "Issue Date",
    "expiresAt": "Expiry Date",
    "institution": "Institution",
    "degree": "Degree",
    "field": "Field of Study",
    "language": "Language",
    "level": "Level",
    "skillName": "Skill",
    "refName": "Full Name",
    "refPosition": "Position",
    "refCompany": "Company",
    "refEmail": "Email",
    "refPhone": "Phone",
    "availability": "Next Availability",
    "contractDuration": "Contract Duration",
    "salaryExpectation": "Salary Expectation",
    "pdfError": "Failed to generate PDF. Please try again.",
    "noPdfData": "Complete at least one section before downloading."
  }
```

- [ ] **Step 3: Add `resume` key to `messages/ru.json`**

Add before the closing `}` of the root object:

```json
  "resume": {
    "title": "Моё резюме",
    "completeness": "{percent}% заполнено",
    "downloadPdf": "Скачать PDF",
    "templateClassic": "Классик",
    "templateModern": "Современный",
    "templateCompact": "Компактный",
    "templateProRequired": "Обновись до Pro, чтобы разблокировать все шаблоны.",
    "sectionPersonal": "Личная информация",
    "sectionExperience": "Опыт в море",
    "sectionCertificates": "Сертификаты",
    "sectionEducation": "Образование",
    "sectionLanguages": "Языки",
    "sectionSkills": "Навыки",
    "sectionReferences": "Рекомендации",
    "sectionPreferences": "Предпочтения",
    "save": "Сохранить",
    "saving": "Сохранение...",
    "saved": "Сохранено ✓",
    "saveError": "Ошибка сохранения. Попробуйте ещё раз.",
    "addEntry": "Добавить запись",
    "edit": "Редактировать",
    "delete": "Удалить",
    "cancel": "Отмена",
    "noEntries": "Записей пока нет.",
    "bio": "О себе",
    "vesselName": "Название судна",
    "vesselType": "Тип судна",
    "grt": "GRT",
    "dwt": "DWT",
    "flag": "Флаг",
    "company": "Компания",
    "position": "Должность",
    "startDate": "Дата начала",
    "endDate": "Дата окончания",
    "current": "По настоящее время",
    "certName": "Название сертификата",
    "issuedBy": "Кем выдан",
    "issuedAt": "Дата выдачи",
    "expiresAt": "Срок действия",
    "institution": "Учебное заведение",
    "degree": "Степень",
    "field": "Специальность",
    "language": "Язык",
    "level": "Уровень",
    "skillName": "Навык",
    "refName": "Полное имя",
    "refPosition": "Должность",
    "refCompany": "Компания",
    "refEmail": "Email",
    "refPhone": "Телефон",
    "availability": "Дата готовности",
    "contractDuration": "Длительность контракта",
    "salaryExpectation": "Ожидаемая зарплата",
    "pdfError": "Ошибка генерации PDF. Попробуйте ещё раз.",
    "noPdfData": "Заполните хотя бы один раздел перед скачиванием."
  }
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/types.ts messages/en.json messages/ru.json
git commit -m "feat: add resume DB types and i18n strings"
```

---

### Task 2: Database Migration

**Files:**
- No code files — SQL to run manually in Supabase dashboard → SQL Editor

**Interfaces:**
- Produces: 6 new Supabase tables consumed by all server actions and queries

- [ ] **Step 1: Run migration SQL in Supabase dashboard**

Go to Supabase dashboard → SQL Editor → New query. Paste and run:

```sql
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users unique not null,
  bio text,
  availability_date date,
  contract_duration text,
  salary_expectation text,
  template text not null default 'classic',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table resumes enable row level security;
create policy "Users manage own resume" on resumes
  for all using (auth.uid() = user_id);

create table resume_experience (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  vessel_name text,
  vessel_type text,
  grt int,
  dwt int,
  flag text,
  company text,
  position text,
  started_at date,
  ended_at date,
  sort_order int not null default 0
);
alter table resume_experience enable row level security;
create policy "Users manage own experience" on resume_experience
  for all using (
    auth.uid() = (select user_id from resumes where id = resume_id)
  );

create table resume_certificates (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  name text,
  issued_by text,
  issued_at date,
  expires_at date,
  sort_order int not null default 0
);
alter table resume_certificates enable row level security;
create policy "Users manage own certificates" on resume_certificates
  for all using (
    auth.uid() = (select user_id from resumes where id = resume_id)
  );

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

create table resume_languages (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid references resumes on delete cascade not null,
  language text,
  level text,
  sort_order int not null default 0
);
alter table resume_languages enable row level security;
create policy "Users manage own languages" on resume_languages
  for all using (
    auth.uid() = (select user_id from resumes where id = resume_id)
  );

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

- [ ] **Step 2: Verify tables exist**

In Supabase → Table Editor, confirm all 7 tables appear: `resumes`, `resume_experience`, `resume_certificates`, `resume_education`, `resume_languages`, `resume_skills`, `resume_references`.

---

### Task 3: Server Actions

**Files:**
- Create: `actions/resume.ts`

**Interfaces:**
- Consumes: `Resume`, `ResumeExperience`, `ResumeCertificate`, `ResumeEducation`, `ResumeLanguage`, `ResumeSkill`, `ResumeReference` from `@/lib/supabase/types` (Task 1)
- Produces: `upsertResumeMeta`, `updateResumeTemplate`, `addExperience`, `updateExperience`, `deleteExperience`, `addCertificate`, `updateCertificate`, `deleteCertificate`, `addEducation`, `updateEducation`, `deleteEducation`, `addLanguage`, `updateLanguage`, `deleteLanguage`, `addSkill`, `updateSkill`, `deleteSkill`, `addReference`, `updateReference`, `deleteReference` — consumed by all section components and template picker

- [ ] **Step 1: Create `actions/resume.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type {
  ResumeExperience,
  ResumeCertificate,
  ResumeEducation,
  ResumeLanguage,
  ResumeSkill,
  ResumeReference,
} from '@/lib/supabase/types'

type Client = ReturnType<typeof createClient>

async function ensureResume(supabase: Client, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('resumes')
    .select('id')
    .eq('user_id', userId)
    .single()
  if (data) return data.id
  const { data: created } = await supabase
    .from('resumes')
    .insert({ user_id: userId })
    .select('id')
    .single()
  return created?.id ?? null
}

export async function upsertResumeMeta(payload: {
  bio?: string | null
  availability_date?: string | null
  contract_duration?: string | null
  salary_expectation?: string | null
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed' }
  const { error } = await supabase
    .from('resumes')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateResumeTemplate(template: 'classic' | 'modern' | 'compact') {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed' }
  const { error } = await supabase
    .from('resumes')
    .update({ template, updated_at: new Date().toISOString() })
    .eq('id', resumeId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function addExperience(data: Omit<ResumeExperience, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated', entry: null }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed', entry: null }
  const { data: entry, error } = await supabase
    .from('resume_experience')
    .insert({ ...data, resume_id: resumeId })
    .select()
    .single()
  if (error) return { error: error.message, entry: null }
  revalidatePath('/', 'layout')
  return { error: null, entry: entry as ResumeExperience }
}

export async function updateExperience(id: string, data: Omit<ResumeExperience, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const { error } = await supabase.from('resume_experience').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteExperience(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const { error } = await supabase.from('resume_experience').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function addCertificate(data: Omit<ResumeCertificate, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated', entry: null }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed', entry: null }
  const { data: entry, error } = await supabase
    .from('resume_certificates')
    .insert({ ...data, resume_id: resumeId })
    .select()
    .single()
  if (error) return { error: error.message, entry: null }
  revalidatePath('/', 'layout')
  return { error: null, entry: entry as ResumeCertificate }
}

export async function updateCertificate(id: string, data: Omit<ResumeCertificate, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const { error } = await supabase.from('resume_certificates').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteCertificate(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const { error } = await supabase.from('resume_certificates').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function addEducation(data: Omit<ResumeEducation, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated', entry: null }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed', entry: null }
  const { data: entry, error } = await supabase
    .from('resume_education')
    .insert({ ...data, resume_id: resumeId })
    .select()
    .single()
  if (error) return { error: error.message, entry: null }
  revalidatePath('/', 'layout')
  return { error: null, entry: entry as ResumeEducation }
}

export async function updateEducation(id: string, data: Omit<ResumeEducation, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const { error } = await supabase.from('resume_education').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteEducation(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const { error } = await supabase.from('resume_education').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function addLanguage(data: Omit<ResumeLanguage, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated', entry: null }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed', entry: null }
  const { data: entry, error } = await supabase
    .from('resume_languages')
    .insert({ ...data, resume_id: resumeId })
    .select()
    .single()
  if (error) return { error: error.message, entry: null }
  revalidatePath('/', 'layout')
  return { error: null, entry: entry as ResumeLanguage }
}

export async function updateLanguage(id: string, data: Omit<ResumeLanguage, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const { error } = await supabase.from('resume_languages').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteLanguage(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const { error } = await supabase.from('resume_languages').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function addSkill(data: Omit<ResumeSkill, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated', entry: null }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed', entry: null }
  const { data: entry, error } = await supabase
    .from('resume_skills')
    .insert({ ...data, resume_id: resumeId })
    .select()
    .single()
  if (error) return { error: error.message, entry: null }
  revalidatePath('/', 'layout')
  return { error: null, entry: entry as ResumeSkill }
}

export async function updateSkill(id: string, data: Omit<ResumeSkill, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const { error } = await supabase.from('resume_skills').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteSkill(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const { error } = await supabase.from('resume_skills').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function addReference(data: Omit<ResumeReference, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated', entry: null }
  const resumeId = await ensureResume(supabase, user.id)
  if (!resumeId) return { error: 'resume_create_failed', entry: null }
  const { data: entry, error } = await supabase
    .from('resume_references')
    .insert({ ...data, resume_id: resumeId })
    .select()
    .single()
  if (error) return { error: error.message, entry: null }
  revalidatePath('/', 'layout')
  return { error: null, entry: entry as ResumeReference }
}

export async function updateReference(id: string, data: Omit<ResumeReference, 'id' | 'resume_id'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const { error } = await supabase.from('resume_references').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function deleteReference(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }
  const { error } = await supabase.from('resume_references').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add actions/resume.ts
git commit -m "feat: add resume server actions"
```

---

### Task 4: Install shadcn Components + Shared UI

**Files:**
- Create (auto-generated): `components/ui/accordion.tsx`, `components/ui/textarea.tsx`
- Create: `components/resume/completeness-bar.tsx`
- Create: `components/resume/template-picker.tsx`

**Interfaces:**
- Consumes: `updateResumeTemplate` from `@/actions/resume` (Task 3)
- Produces: `<CompletenessBar score={number}>`, `<TemplatePicker selected template subscriptionStatus onSelect>` — consumed by `resume-editor.tsx` (Task 7)

- [ ] **Step 1: Install shadcn Accordion and Textarea**

```bash
npx shadcn@latest add accordion textarea
```

Expected: `components/ui/accordion.tsx` and `components/ui/textarea.tsx` created.

- [ ] **Step 2: Create `components/resume/completeness-bar.tsx`**

```tsx
'use client'

import { useTranslations } from 'next-intl'

export function CompletenessBar({ score }: { score: number }) {
  const t = useTranslations('resume')
  const percent = Math.round(score * 100)
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground shrink-0">
        {t('completeness', { percent })}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/resume/template-picker.tsx`**

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { updateResumeTemplate } from '@/actions/resume'

type Template = 'classic' | 'modern' | 'compact'

type Props = {
  selected: Template
  subscriptionStatus: 'free' | 'pro' | 'enterprise'
  onSelect: (t: Template) => void
}

const TEMPLATES: { id: Template; labelKey: 'templateClassic' | 'templateModern' | 'templateCompact' }[] = [
  { id: 'classic', labelKey: 'templateClassic' },
  { id: 'modern', labelKey: 'templateModern' },
  { id: 'compact', labelKey: 'templateCompact' },
]

export function TemplatePicker({ selected, subscriptionStatus, onSelect }: Props) {
  const t = useTranslations('resume')
  const isPro = subscriptionStatus !== 'free'

  async function handleSelect(template: Template) {
    if (!isPro && template !== 'classic') {
      toast.info(t('templateProRequired'))
      return
    }
    const result = await updateResumeTemplate(template)
    if (!result.error) onSelect(template)
    else toast.error(t('saveError'))
  }

  return (
    <div className="flex gap-3">
      {TEMPLATES.map(({ id, labelKey }) => {
        const locked = !isPro && id !== 'classic'
        return (
          <button
            key={id}
            type="button"
            onClick={() => handleSelect(id)}
            className={cn(
              'relative flex-1 border-2 rounded-lg p-3 text-sm font-medium transition-colors text-center',
              selected === id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
              locked && 'opacity-60'
            )}
          >
            <span>{t(labelKey)}</span>
            {locked && (
              <span className="absolute top-1 right-1">
                <Badge variant="secondary" className="text-xs gap-1 py-0">
                  <Lock className="h-3 w-3" />Pro
                </Badge>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add components/ui/accordion.tsx components/ui/textarea.tsx components/resume/completeness-bar.tsx components/resume/template-picker.tsx
git commit -m "feat: add accordion/textarea + resume shared UI components"
```

---

### Task 5: Simple Section Components (Personal + Preferences)

**Files:**
- Create: `components/resume/section-personal.tsx`
- Create: `components/resume/section-preferences.tsx`

**Interfaces:**
- Consumes: `upsertResumeMeta` from `@/actions/resume` (Task 3)
- Produces: `<SectionPersonal initialBio onComplete>`, `<SectionPreferences initialData onComplete>` — consumed by `resume-editor.tsx` (Task 7)

- [ ] **Step 1: Create `components/resume/section-personal.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { upsertResumeMeta } from '@/actions/resume'

type Props = {
  initialBio: string | null
  onComplete: (complete: boolean) => void
}

export function SectionPersonal({ initialBio, onComplete }: Props) {
  const t = useTranslations('resume')
  const [bio, setBio] = useState(initialBio ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const result = await upsertResumeMeta({ bio: bio || null })
    setSaving(false)
    if (result.error) {
      toast.error(t('saveError'))
    } else {
      setSaved(true)
      onComplete(bio.trim().length > 0)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex flex-col gap-1">
        <Label htmlFor="bio">{t('bio')}</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => { setBio(e.target.value); setSaved(false) }}
          rows={4}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? t('saving') : t('save')}
        </Button>
        {saved && <span className="text-sm text-green-600">{t('saved')}</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/resume/section-preferences.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { upsertResumeMeta } from '@/actions/resume'

type InitialData = {
  availability_date: string | null
  contract_duration: string | null
  salary_expectation: string | null
}

type Props = {
  initialData: InitialData
  onComplete: (complete: boolean) => void
}

export function SectionPreferences({ initialData, onComplete }: Props) {
  const t = useTranslations('resume')
  const [form, setForm] = useState<InitialData>(initialData)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(field: keyof InitialData, value: string) {
    setForm(prev => ({ ...prev, [field]: value || null }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    const result = await upsertResumeMeta(form)
    setSaving(false)
    if (result.error) {
      toast.error(t('saveError'))
    } else {
      setSaved(true)
      const anyFilled = !!(form.availability_date || form.contract_duration || form.salary_expectation)
      onComplete(anyFilled)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex flex-col gap-1">
        <Label htmlFor="availability">{t('availability')}</Label>
        <Input
          id="availability"
          type="date"
          value={form.availability_date ?? ''}
          onChange={e => set('availability_date', e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="contract">{t('contractDuration')}</Label>
        <Input
          id="contract"
          value={form.contract_duration ?? ''}
          onChange={e => set('contract_duration', e.target.value)}
          placeholder="e.g. 4–6 months"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="salary">{t('salaryExpectation')}</Label>
        <Input
          id="salary"
          value={form.salary_expectation ?? ''}
          onChange={e => set('salary_expectation', e.target.value)}
          placeholder="e.g. $3,500/month"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? t('saving') : t('save')}
        </Button>
        {saved && <span className="text-sm text-green-600">{t('saved')}</span>}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add components/resume/section-personal.tsx components/resume/section-preferences.tsx
git commit -m "feat: add personal and preferences section components"
```

---

### Task 6: List Section Components

**Files:**
- Create: `components/resume/section-experience.tsx`
- Create: `components/resume/section-certificates.tsx`
- Create: `components/resume/section-education.tsx`
- Create: `components/resume/section-languages.tsx`
- Create: `components/resume/section-skills.tsx`
- Create: `components/resume/section-references.tsx`

**Interfaces:**
- Consumes: all add/update/delete actions from `@/actions/resume` (Task 3); types from `@/lib/supabase/types` (Task 1)
- Produces: `<SectionExperience initialData onComplete>`, `<SectionCertificates initialData onComplete>`, `<SectionEducation initialData onComplete>`, `<SectionLanguages initialData onComplete>`, `<SectionSkills initialData onComplete>`, `<SectionReferences initialData onComplete>` — consumed by `resume-editor.tsx` (Task 7)

- [ ] **Step 1: Create `components/resume/section-experience.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addExperience, updateExperience, deleteExperience } from '@/actions/resume'
import type { ResumeExperience } from '@/lib/supabase/types'

type Props = {
  initialData: ResumeExperience[]
  onComplete: (complete: boolean) => void
}

type FormState = Omit<ResumeExperience, 'id' | 'resume_id'>

const EMPTY: FormState = {
  vessel_name: null, vessel_type: null, grt: null, dwt: null,
  flag: null, company: null, position: null, started_at: null,
  ended_at: null, sort_order: 0,
}

export function SectionExperience({ initialData, onComplete }: Props) {
  const t = useTranslations('resume')
  const [entries, setEntries] = useState(initialData)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  function setField(field: keyof FormState, value: string | number | null) {
    setForm(prev => ({ ...prev, [field]: value === '' ? null : value }))
  }

  function startAdd() {
    setForm({ ...EMPTY, sort_order: entries.length })
    setEditingId(null)
    setAdding(true)
  }

  function startEdit(entry: ResumeExperience) {
    const { id, resume_id, ...rest } = entry
    setForm(rest)
    setEditingId(id)
    setAdding(false)
  }

  async function handleSave() {
    setSaving(true)
    if (editingId) {
      const result = await updateExperience(editingId, form)
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      setEntries(prev => prev.map(e => e.id === editingId ? { ...e, ...form } : e))
      setEditingId(null)
    } else {
      const result = await addExperience(form)
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      if (result.entry) {
        const next = [...entries, result.entry]
        setEntries(next)
        onComplete(true)
      }
      setAdding(false)
    }
    setForm(EMPTY)
  }

  async function handleDelete(id: string) {
    const result = await deleteExperience(id)
    if (result.error) { toast.error(t('saveError')); return }
    const next = entries.filter(e => e.id !== id)
    setEntries(next)
    onComplete(next.length > 0)
  }

  const showForm = adding || editingId !== null

  return (
    <div className="flex flex-col gap-3 p-1">
      {entries.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">{t('noEntries')}</p>
      )}
      {entries.map(entry => (
        editingId === entry.id ? null : (
          <Card key={entry.id}>
            <CardContent className="pt-4 flex items-start justify-between gap-2">
              <div className="text-sm min-w-0">
                <p className="font-medium truncate">{entry.position} — {entry.vessel_name}</p>
                <p className="text-muted-foreground">{entry.company}{entry.flag ? ` · ${entry.flag}` : ''}</p>
                <p className="text-muted-foreground text-xs">{entry.vessel_type}{entry.grt ? ` · ${entry.grt} GRT` : ''}{entry.dwt ? ` · ${entry.dwt} DWT` : ''}</p>
                <p className="text-muted-foreground text-xs">{entry.started_at} — {entry.ended_at ?? t('current')}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => startEdit(entry)} aria-label={t('edit')}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} aria-label={t('delete')}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        )
      ))}
      {editingId && (
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('vesselName')}><Input value={form.vessel_name ?? ''} onChange={e => setField('vessel_name', e.target.value)} /></Field>
            <Field label={t('vesselType')}><Input value={form.vessel_type ?? ''} onChange={e => setField('vessel_type', e.target.value)} /></Field>
            <Field label={t('grt')}><Input type="number" value={form.grt ?? ''} onChange={e => setField('grt', e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label={t('dwt')}><Input type="number" value={form.dwt ?? ''} onChange={e => setField('dwt', e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label={t('flag')}><Input value={form.flag ?? ''} onChange={e => setField('flag', e.target.value)} /></Field>
            <Field label={t('company')}><Input value={form.company ?? ''} onChange={e => setField('company', e.target.value)} /></Field>
            <Field label={t('position')} className="col-span-2"><Input value={form.position ?? ''} onChange={e => setField('position', e.target.value)} /></Field>
            <Field label={t('startDate')}><Input type="date" value={form.started_at ?? ''} onChange={e => setField('started_at', e.target.value)} /></Field>
            <Field label={t('endDate')}><Input type="date" value={form.ended_at ?? ''} onChange={e => setField('ended_at', e.target.value)} /></Field>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? t('saving') : t('save')}</Button>
            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>{t('cancel')}</Button>
          </div>
        </div>
      )}
      {adding && (
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('vesselName')}><Input value={form.vessel_name ?? ''} onChange={e => setField('vessel_name', e.target.value)} /></Field>
            <Field label={t('vesselType')}><Input value={form.vessel_type ?? ''} onChange={e => setField('vessel_type', e.target.value)} /></Field>
            <Field label={t('grt')}><Input type="number" value={form.grt ?? ''} onChange={e => setField('grt', e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label={t('dwt')}><Input type="number" value={form.dwt ?? ''} onChange={e => setField('dwt', e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label={t('flag')}><Input value={form.flag ?? ''} onChange={e => setField('flag', e.target.value)} /></Field>
            <Field label={t('company')}><Input value={form.company ?? ''} onChange={e => setField('company', e.target.value)} /></Field>
            <Field label={t('position')} className="col-span-2"><Input value={form.position ?? ''} onChange={e => setField('position', e.target.value)} /></Field>
            <Field label={t('startDate')}><Input type="date" value={form.started_at ?? ''} onChange={e => setField('started_at', e.target.value)} /></Field>
            <Field label={t('endDate')}><Input type="date" value={form.ended_at ?? ''} onChange={e => setField('ended_at', e.target.value)} /></Field>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? t('saving') : t('save')}</Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>{t('cancel')}</Button>
          </div>
        </div>
      )}
      {!showForm && (
        <Button variant="outline" size="sm" className="w-fit" onClick={startAdd}>
          <Plus className="h-4 w-4 mr-2" />{t('addEntry')}
        </Button>
      )}
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create `components/resume/section-certificates.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addCertificate, updateCertificate, deleteCertificate } from '@/actions/resume'
import type { ResumeCertificate } from '@/lib/supabase/types'

type Props = { initialData: ResumeCertificate[]; onComplete: (complete: boolean) => void }
type FormState = Omit<ResumeCertificate, 'id' | 'resume_id'>
const EMPTY: FormState = { name: null, issued_by: null, issued_at: null, expires_at: null, sort_order: 0 }

export function SectionCertificates({ initialData, onComplete }: Props) {
  const t = useTranslations('resume')
  const [entries, setEntries] = useState(initialData)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  function setField(field: keyof FormState, value: string | null) {
    setForm(prev => ({ ...prev, [field]: value || null }))
  }

  function startEdit(entry: ResumeCertificate) {
    const { id, resume_id, ...rest } = entry
    setForm(rest); setEditingId(id); setAdding(false)
  }

  async function handleSave() {
    setSaving(true)
    if (editingId) {
      const result = await updateCertificate(editingId, form)
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      setEntries(prev => prev.map(e => e.id === editingId ? { ...e, ...form } : e))
      setEditingId(null)
    } else {
      const result = await addCertificate({ ...form, sort_order: entries.length })
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      if (result.entry) { setEntries(prev => [...prev, result.entry!]); onComplete(true) }
      setAdding(false)
    }
    setForm(EMPTY)
  }

  async function handleDelete(id: string) {
    const result = await deleteCertificate(id)
    if (result.error) { toast.error(t('saveError')); return }
    const next = entries.filter(e => e.id !== id)
    setEntries(next); onComplete(next.length > 0)
  }

  const showForm = adding || editingId !== null

  return (
    <div className="flex flex-col gap-3 p-1">
      {entries.length === 0 && !showForm && <p className="text-sm text-muted-foreground">{t('noEntries')}</p>}
      {entries.map(entry => editingId === entry.id ? null : (
        <Card key={entry.id}>
          <CardContent className="pt-4 flex items-start justify-between gap-2">
            <div className="text-sm">
              <p className="font-medium">{entry.name}</p>
              <p className="text-muted-foreground">{entry.issued_by}</p>
              <p className="text-muted-foreground text-xs">{entry.issued_at}{entry.expires_at ? ` — ${entry.expires_at}` : ''}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => startEdit(entry)} aria-label={t('edit')}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} aria-label={t('delete')}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {showForm && (
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2"><Label>{t('certName')}</Label><Input value={form.name ?? ''} onChange={e => setField('name', e.target.value)} /></div>
            <div className="flex flex-col gap-1 col-span-2"><Label>{t('issuedBy')}</Label><Input value={form.issued_by ?? ''} onChange={e => setField('issued_by', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('issuedAt')}</Label><Input type="date" value={form.issued_at ?? ''} onChange={e => setField('issued_at', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('expiresAt')}</Label><Input type="date" value={form.expires_at ?? ''} onChange={e => setField('expires_at', e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? t('saving') : t('save')}</Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditingId(null) }}>{t('cancel')}</Button>
          </div>
        </div>
      )}
      {!showForm && (
        <Button variant="outline" size="sm" className="w-fit" onClick={() => { setForm(EMPTY); setAdding(true) }}>
          <Plus className="h-4 w-4 mr-2" />{t('addEntry')}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `components/resume/section-education.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addEducation, updateEducation, deleteEducation } from '@/actions/resume'
import type { ResumeEducation } from '@/lib/supabase/types'

type Props = { initialData: ResumeEducation[]; onComplete: (complete: boolean) => void }
type FormState = Omit<ResumeEducation, 'id' | 'resume_id'>
const EMPTY: FormState = { institution: null, degree: null, field: null, started_at: null, ended_at: null, sort_order: 0 }

export function SectionEducation({ initialData, onComplete }: Props) {
  const t = useTranslations('resume')
  const [entries, setEntries] = useState(initialData)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  function setField(field: keyof FormState, value: string | null) {
    setForm(prev => ({ ...prev, [field]: value || null }))
  }

  function startEdit(entry: ResumeEducation) {
    const { id, resume_id, ...rest } = entry
    setForm(rest); setEditingId(id); setAdding(false)
  }

  async function handleSave() {
    setSaving(true)
    if (editingId) {
      const result = await updateEducation(editingId, form)
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      setEntries(prev => prev.map(e => e.id === editingId ? { ...e, ...form } : e))
      setEditingId(null)
    } else {
      const result = await addEducation({ ...form, sort_order: entries.length })
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      if (result.entry) { setEntries(prev => [...prev, result.entry!]); onComplete(true) }
      setAdding(false)
    }
    setForm(EMPTY)
  }

  async function handleDelete(id: string) {
    const result = await deleteEducation(id)
    if (result.error) { toast.error(t('saveError')); return }
    const next = entries.filter(e => e.id !== id)
    setEntries(next); onComplete(next.length > 0)
  }

  const showForm = adding || editingId !== null

  return (
    <div className="flex flex-col gap-3 p-1">
      {entries.length === 0 && !showForm && <p className="text-sm text-muted-foreground">{t('noEntries')}</p>}
      {entries.map(entry => editingId === entry.id ? null : (
        <Card key={entry.id}>
          <CardContent className="pt-4 flex items-start justify-between gap-2">
            <div className="text-sm">
              <p className="font-medium">{entry.degree}{entry.field ? ` in ${entry.field}` : ''}</p>
              <p className="text-muted-foreground">{entry.institution}</p>
              <p className="text-muted-foreground text-xs">{entry.started_at} — {entry.ended_at}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => startEdit(entry)} aria-label={t('edit')}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} aria-label={t('delete')}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {showForm && (
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2"><Label>{t('institution')}</Label><Input value={form.institution ?? ''} onChange={e => setField('institution', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('degree')}</Label><Input value={form.degree ?? ''} onChange={e => setField('degree', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('field')}</Label><Input value={form.field ?? ''} onChange={e => setField('field', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('startDate')}</Label><Input type="date" value={form.started_at ?? ''} onChange={e => setField('started_at', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('endDate')}</Label><Input type="date" value={form.ended_at ?? ''} onChange={e => setField('ended_at', e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? t('saving') : t('save')}</Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditingId(null) }}>{t('cancel')}</Button>
          </div>
        </div>
      )}
      {!showForm && (
        <Button variant="outline" size="sm" className="w-fit" onClick={() => { setForm(EMPTY); setAdding(true) }}>
          <Plus className="h-4 w-4 mr-2" />{t('addEntry')}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create `components/resume/section-languages.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addLanguage, updateLanguage, deleteLanguage } from '@/actions/resume'
import type { ResumeLanguage } from '@/lib/supabase/types'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'] as const

type Props = { initialData: ResumeLanguage[]; onComplete: (complete: boolean) => void }
type FormState = Omit<ResumeLanguage, 'id' | 'resume_id'>
const EMPTY: FormState = { language: null, level: null, sort_order: 0 }

export function SectionLanguages({ initialData, onComplete }: Props) {
  const t = useTranslations('resume')
  const [entries, setEntries] = useState(initialData)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  function startEdit(entry: ResumeLanguage) {
    const { id, resume_id, ...rest } = entry
    setForm(rest); setEditingId(id); setAdding(false)
  }

  async function handleSave() {
    setSaving(true)
    if (editingId) {
      const result = await updateLanguage(editingId, form)
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      setEntries(prev => prev.map(e => e.id === editingId ? { ...e, ...form } : e))
      setEditingId(null)
    } else {
      const result = await addLanguage({ ...form, sort_order: entries.length })
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      if (result.entry) { setEntries(prev => [...prev, result.entry!]); onComplete(true) }
      setAdding(false)
    }
    setForm(EMPTY)
  }

  async function handleDelete(id: string) {
    const result = await deleteLanguage(id)
    if (result.error) { toast.error(t('saveError')); return }
    const next = entries.filter(e => e.id !== id)
    setEntries(next); onComplete(next.length > 0)
  }

  const showForm = adding || editingId !== null

  return (
    <div className="flex flex-col gap-3 p-1">
      {entries.length === 0 && !showForm && <p className="text-sm text-muted-foreground">{t('noEntries')}</p>}
      {entries.map(entry => editingId === entry.id ? null : (
        <Card key={entry.id}>
          <CardContent className="pt-4 flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{entry.language} — {entry.level}</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => startEdit(entry)} aria-label={t('edit')}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} aria-label={t('delete')}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {showForm && (
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label>{t('language')}</Label>
              <Input value={form.language ?? ''} onChange={e => setForm(prev => ({ ...prev, language: e.target.value || null }))} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t('level')}</Label>
              <Select value={form.level ?? ''} onValueChange={v => setForm(prev => ({ ...prev, level: v || null }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? t('saving') : t('save')}</Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditingId(null) }}>{t('cancel')}</Button>
          </div>
        </div>
      )}
      {!showForm && (
        <Button variant="outline" size="sm" className="w-fit" onClick={() => { setForm(EMPTY); setAdding(true) }}>
          <Plus className="h-4 w-4 mr-2" />{t('addEntry')}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create `components/resume/section-skills.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addSkill, deleteSkill } from '@/actions/resume'
import type { ResumeSkill } from '@/lib/supabase/types'

type Props = { initialData: ResumeSkill[]; onComplete: (complete: boolean) => void }

export function SectionSkills({ initialData, onComplete }: Props) {
  const t = useTranslations('resume')
  const [entries, setEntries] = useState(initialData)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    const name = input.trim()
    if (!name) return
    setSaving(true)
    const result = await addSkill({ name, sort_order: entries.length })
    setSaving(false)
    if (result.error) { toast.error(t('saveError')); return }
    if (result.entry) {
      const next = [...entries, result.entry]
      setEntries(next)
      onComplete(true)
    }
    setInput('')
  }

  async function handleDelete(id: string) {
    const result = await deleteSkill(id)
    if (result.error) { toast.error(t('saveError')); return }
    const next = entries.filter(e => e.id !== id)
    setEntries(next)
    onComplete(next.length > 0)
  }

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex flex-wrap gap-2">
        {entries.map(entry => (
          <Badge key={entry.id} variant="secondary" className="gap-1 text-sm py-1">
            {entry.name}
            <button type="button" onClick={() => handleDelete(entry.id)} aria-label={t('delete')} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {entries.length === 0 && <p className="text-sm text-muted-foreground">{t('noEntries')}</p>}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('skillName')}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          className="max-w-xs"
        />
        <Button size="sm" onClick={handleAdd} disabled={saving || !input.trim()}>
          <Plus className="h-4 w-4 mr-1" />{t('addEntry')}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create `components/resume/section-references.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addReference, updateReference, deleteReference } from '@/actions/resume'
import type { ResumeReference } from '@/lib/supabase/types'

type Props = { initialData: ResumeReference[]; onComplete: (complete: boolean) => void }
type FormState = Omit<ResumeReference, 'id' | 'resume_id'>
const EMPTY: FormState = { full_name: null, position: null, company: null, email: null, phone: null, sort_order: 0 }

export function SectionReferences({ initialData, onComplete }: Props) {
  const t = useTranslations('resume')
  const [entries, setEntries] = useState(initialData)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  function setField(field: keyof FormState, value: string | null) {
    setForm(prev => ({ ...prev, [field]: value || null }))
  }

  function startEdit(entry: ResumeReference) {
    const { id, resume_id, ...rest } = entry
    setForm(rest); setEditingId(id); setAdding(false)
  }

  async function handleSave() {
    setSaving(true)
    if (editingId) {
      const result = await updateReference(editingId, form)
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      setEntries(prev => prev.map(e => e.id === editingId ? { ...e, ...form } : e))
      setEditingId(null)
    } else {
      const result = await addReference({ ...form, sort_order: entries.length })
      setSaving(false)
      if (result.error) { toast.error(t('saveError')); return }
      if (result.entry) { setEntries(prev => [...prev, result.entry!]); onComplete(true) }
      setAdding(false)
    }
    setForm(EMPTY)
  }

  async function handleDelete(id: string) {
    const result = await deleteReference(id)
    if (result.error) { toast.error(t('saveError')); return }
    const next = entries.filter(e => e.id !== id)
    setEntries(next); onComplete(next.length > 0)
  }

  const showForm = adding || editingId !== null

  return (
    <div className="flex flex-col gap-3 p-1">
      {entries.length === 0 && !showForm && <p className="text-sm text-muted-foreground">{t('noEntries')}</p>}
      {entries.map(entry => editingId === entry.id ? null : (
        <Card key={entry.id}>
          <CardContent className="pt-4 flex items-start justify-between gap-2">
            <div className="text-sm">
              <p className="font-medium">{entry.full_name}</p>
              <p className="text-muted-foreground">{entry.position}{entry.company ? ` · ${entry.company}` : ''}</p>
              <p className="text-muted-foreground text-xs">{entry.email}{entry.phone ? ` · ${entry.phone}` : ''}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => startEdit(entry)} aria-label={t('edit')}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} aria-label={t('delete')}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {showForm && (
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2"><Label>{t('refName')}</Label><Input value={form.full_name ?? ''} onChange={e => setField('full_name', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('refPosition')}</Label><Input value={form.position ?? ''} onChange={e => setField('position', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('refCompany')}</Label><Input value={form.company ?? ''} onChange={e => setField('company', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('refEmail')}</Label><Input type="email" value={form.email ?? ''} onChange={e => setField('email', e.target.value)} /></div>
            <div className="flex flex-col gap-1"><Label>{t('refPhone')}</Label><Input type="tel" value={form.phone ?? ''} onChange={e => setField('phone', e.target.value)} /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? t('saving') : t('save')}</Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setEditingId(null) }}>{t('cancel')}</Button>
          </div>
        </div>
      )}
      {!showForm && (
        <Button variant="outline" size="sm" className="w-fit" onClick={() => { setForm(EMPTY); setAdding(true) }}>
          <Plus className="h-4 w-4 mr-2" />{t('addEntry')}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Verify build**

```bash
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add components/resume/section-experience.tsx components/resume/section-certificates.tsx components/resume/section-education.tsx components/resume/section-languages.tsx components/resume/section-skills.tsx components/resume/section-references.tsx
git commit -m "feat: add all list section components"
```

---

### Task 7: Resume Editor + Dashboard Page

**Files:**
- Create: `components/resume/resume-editor.tsx`
- Modify: `app/[locale]/dashboard/resume/page.tsx`
- Modify: `app/[locale]/dashboard/page.tsx` (fix `hasResume` hardcoded false)

**Interfaces:**
- Consumes: all section components (Tasks 5–6), `CompletenessBar` + `TemplatePicker` (Task 4), `ResumeData` type (Task 1)
- Produces: functional `/[locale]/dashboard/resume` route

- [ ] **Step 1: Create `components/resume/resume-editor.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { CompletenessBar } from './completeness-bar'
import { TemplatePicker } from './template-picker'
import { SectionPersonal } from './section-personal'
import { SectionExperience } from './section-experience'
import { SectionCertificates } from './section-certificates'
import { SectionEducation } from './section-education'
import { SectionLanguages } from './section-languages'
import { SectionSkills } from './section-skills'
import { SectionReferences } from './section-references'
import { SectionPreferences } from './section-preferences'
import type { ResumeData } from '@/lib/supabase/types'

type Template = 'classic' | 'modern' | 'compact'
type SectionKey = 'personal' | 'experience' | 'certificates' | 'education' | 'languages' | 'skills' | 'references' | 'preferences'

const SECTION_KEYS: SectionKey[] = ['personal', 'experience', 'certificates', 'education', 'languages', 'skills', 'references', 'preferences']

function initCompleted(data: ResumeData): Record<SectionKey, boolean> {
  return {
    personal: !!data.resume?.bio,
    experience: data.experience.length > 0,
    certificates: data.certificates.length > 0,
    education: data.education.length > 0,
    languages: data.languages.length > 0,
    skills: data.skills.length > 0,
    references: data.references.length > 0,
    preferences: !!(data.resume?.availability_date || data.resume?.contract_duration || data.resume?.salary_expectation),
  }
}

type Props = {
  data: ResumeData
  subscriptionStatus: 'free' | 'pro' | 'enterprise'
}

export function ResumeEditor({ data, subscriptionStatus }: Props) {
  const t = useTranslations('resume')
  const [completed, setCompleted] = useState<Record<SectionKey, boolean>>(initCompleted(data))
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(data.resume?.template ?? 'classic')

  function onComplete(key: SectionKey) {
    return (complete: boolean) => setCompleted(prev => ({ ...prev, [key]: complete }))
  }

  const score = SECTION_KEYS.filter(k => completed[k]).length / SECTION_KEYS.length
  const hasResume = SECTION_KEYS.some(k => completed[k])

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <CompletenessBar score={score} />
        <a href={`/api/resume/pdf?template=${selectedTemplate}`} download>
          <Button disabled={!hasResume} size="sm">{t('downloadPdf')}</Button>
        </a>
      </div>

      <TemplatePicker
        selected={selectedTemplate}
        subscriptionStatus={subscriptionStatus}
        onSelect={setSelectedTemplate}
      />

      <Accordion type="single" collapsible className="space-y-2">
        <AccordionItem value="personal" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionPersonal')}</AccordionTrigger>
          <AccordionContent>
            <SectionPersonal initialBio={data.resume?.bio ?? null} onComplete={onComplete('personal')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="experience" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionExperience')}</AccordionTrigger>
          <AccordionContent>
            <SectionExperience initialData={data.experience} onComplete={onComplete('experience')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="certificates" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionCertificates')}</AccordionTrigger>
          <AccordionContent>
            <SectionCertificates initialData={data.certificates} onComplete={onComplete('certificates')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="education" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionEducation')}</AccordionTrigger>
          <AccordionContent>
            <SectionEducation initialData={data.education} onComplete={onComplete('education')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="languages" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionLanguages')}</AccordionTrigger>
          <AccordionContent>
            <SectionLanguages initialData={data.languages} onComplete={onComplete('languages')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="skills" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionSkills')}</AccordionTrigger>
          <AccordionContent>
            <SectionSkills initialData={data.skills} onComplete={onComplete('skills')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="references" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionReferences')}</AccordionTrigger>
          <AccordionContent>
            <SectionReferences initialData={data.references} onComplete={onComplete('references')} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="preferences" className="border rounded-lg px-4">
          <AccordionTrigger>{t('sectionPreferences')}</AccordionTrigger>
          <AccordionContent>
            <SectionPreferences
              initialData={{
                availability_date: data.resume?.availability_date ?? null,
                contract_duration: data.resume?.contract_duration ?? null,
                salary_expectation: data.resume?.salary_expectation ?? null,
              }}
              onComplete={onComplete('preferences')}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
```

- [ ] **Step 2: Replace `app/[locale]/dashboard/resume/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ResumeEditor } from '@/components/resume/resume-editor'
import type {
  Resume,
  ResumeData,
  ResumeExperience,
  ResumeCertificate,
  ResumeEducation,
  ResumeLanguage,
  ResumeSkill,
  ResumeReference,
} from '@/lib/supabase/types'

export default async function ResumePage({ params: { locale } }: { params: { locale: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const t = await getTranslations('resume')

  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const subscriptionStatus = (rawProfile?.subscription_status ?? 'free') as 'free' | 'pro' | 'enterprise'

  const { data: resume } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .single()

  let resumeData: ResumeData = {
    resume: resume as Resume | null,
    experience: [],
    certificates: [],
    education: [],
    languages: [],
    skills: [],
    references: [],
  }

  if (resume) {
    const [exp, certs, edu, langs, skills, refs] = await Promise.all([
      supabase.from('resume_experience').select('*').eq('resume_id', resume.id).order('sort_order'),
      supabase.from('resume_certificates').select('*').eq('resume_id', resume.id).order('sort_order'),
      supabase.from('resume_education').select('*').eq('resume_id', resume.id).order('sort_order'),
      supabase.from('resume_languages').select('*').eq('resume_id', resume.id).order('sort_order'),
      supabase.from('resume_skills').select('*').eq('resume_id', resume.id).order('sort_order'),
      supabase.from('resume_references').select('*').eq('resume_id', resume.id).order('sort_order'),
    ])
    resumeData = {
      resume: resume as Resume,
      experience: (exp.data ?? []) as ResumeExperience[],
      certificates: (certs.data ?? []) as ResumeCertificate[],
      education: (edu.data ?? []) as ResumeEducation[],
      languages: (langs.data ?? []) as ResumeLanguage[],
      skills: (skills.data ?? []) as ResumeSkill[],
      references: (refs.data ?? []) as ResumeReference[],
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <ResumeEditor data={resumeData} subscriptionStatus={subscriptionStatus} />
    </div>
  )
}
```

- [ ] **Step 3: Fix `hasResume` in `app/[locale]/dashboard/page.tsx`**

In `app/[locale]/dashboard/page.tsx`, after fetching the profile, add a resume check:

```tsx
// After the existing profile fetch, add:
const { data: resumeRow } = await supabase
  .from('resumes')
  .select('id')
  .eq('user_id', user.id)
  .single()

const hasResume = !!resumeRow
```

Then change `<ResumeWidget hasResume={false} />` to `<ResumeWidget hasResume={hasResume} />`.

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add components/resume/resume-editor.tsx app/[locale]/dashboard/resume/page.tsx app/[locale]/dashboard/page.tsx
git commit -m "feat: add resume editor client component and dashboard resume page"
```

---

### Task 8: PDF Templates + Route Handler

**Files:**
- Create: `components/resume/pdf/types.ts`
- Create: `components/resume/pdf/template-classic.tsx`
- Create: `components/resume/pdf/template-modern.tsx`
- Create: `components/resume/pdf/template-compact.tsx`
- Create: `app/api/resume/pdf/route.ts`

**Interfaces:**
- Consumes: all resume types from `@/lib/supabase/types` (Task 1)
- Produces: `GET /api/resume/pdf?template=classic|modern|compact` → `application/pdf` attachment

- [ ] **Step 1: Install `@react-pdf/renderer`**

```bash
npm install @react-pdf/renderer
npm install --save-dev @types/react-pdf
```

Expected: package installed, no peer dependency errors.

- [ ] **Step 2: Create `components/resume/pdf/types.ts`**

```ts
import type {
  Resume,
  ResumeExperience,
  ResumeCertificate,
  ResumeEducation,
  ResumeLanguage,
  ResumeSkill,
  ResumeReference,
} from '@/lib/supabase/types'

export type PdfResumeData = {
  profile: {
    full_name: string | null
    rank: string | null
    fleet_type: string | null
  }
  resume: Resume
  experience: ResumeExperience[]
  certificates: ResumeCertificate[]
  education: ResumeEducation[]
  languages: ResumeLanguage[]
  skills: ResumeSkill[]
  references: ResumeReference[]
  watermark: boolean
}
```

- [ ] **Step 3: Create `components/resume/pdf/template-classic.tsx`**

```tsx
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { PdfResumeData } from './types'

const s = StyleSheet.create({
  page: { flexDirection: 'row', padding: 32, fontSize: 9, fontFamily: 'Helvetica', color: '#1e293b' },
  left: { width: '33%', paddingRight: 16, borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  right: { flex: 1, paddingLeft: 16 },
  name: { fontSize: 17, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  subtitle: { fontSize: 10, color: '#475569', marginBottom: 14 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.8, color: '#64748b', marginTop: 12, marginBottom: 4 },
  rule: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 6 },
  entryBlock: { marginBottom: 7 },
  bold: { fontFamily: 'Helvetica-Bold' },
  muted: { color: '#64748b', fontSize: 8 },
  watermark: { position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', color: '#cbd5e1', fontSize: 7 },
})

export function TemplateClassic({ data }: { data: PdfResumeData }) {
  const { profile, resume, experience, certificates, education, languages, skills, references, watermark } = data

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.left}>
          <Text style={s.name}>{profile.full_name ?? 'Seafarer'}</Text>
          <Text style={s.subtitle}>{[profile.rank, profile.fleet_type].filter(Boolean).join(' · ')}</Text>

          {languages.length > 0 && <>
            <Text style={s.sectionTitle}>Languages</Text>
            <View style={s.rule} />
            {languages.map(l => <Text key={l.id} style={{ marginBottom: 2 }}>{l.language} — {l.level}</Text>)}
          </>}

          {skills.length > 0 && <>
            <Text style={s.sectionTitle}>Skills</Text>
            <View style={s.rule} />
            {skills.map(sk => <Text key={sk.id} style={{ marginBottom: 2 }}>• {sk.name}</Text>)}
          </>}

          {(resume.availability_date || resume.contract_duration || resume.salary_expectation) && <>
            <Text style={s.sectionTitle}>Preferences</Text>
            <View style={s.rule} />
            {resume.availability_date && <Text style={{ marginBottom: 2 }}>Available: {resume.availability_date}</Text>}
            {resume.contract_duration && <Text style={{ marginBottom: 2 }}>Contract: {resume.contract_duration}</Text>}
            {resume.salary_expectation && <Text style={{ marginBottom: 2 }}>Salary: {resume.salary_expectation}</Text>}
          </>}
        </View>

        <View style={s.right}>
          {resume.bio && <>
            <Text style={s.sectionTitle}>Profile</Text>
            <View style={s.rule} />
            <Text style={{ marginBottom: 8, lineHeight: 1.5 }}>{resume.bio}</Text>
          </>}

          {experience.length > 0 && <>
            <Text style={s.sectionTitle}>Sea Experience</Text>
            <View style={s.rule} />
            {experience.map(e => (
              <View key={e.id} style={s.entryBlock}>
                <Text style={s.bold}>{e.position} — {e.vessel_name}</Text>
                <Text style={s.muted}>{e.company}{e.flag ? ` · ${e.flag}` : ''}</Text>
                <Text style={s.muted}>{e.vessel_type}{e.grt ? ` · ${e.grt} GRT` : ''}{e.dwt ? ` · ${e.dwt} DWT` : ''}</Text>
                <Text style={s.muted}>{e.started_at} — {e.ended_at ?? 'Present'}</Text>
              </View>
            ))}
          </>}

          {certificates.length > 0 && <>
            <Text style={s.sectionTitle}>Certificates</Text>
            <View style={s.rule} />
            {certificates.map(c => (
              <View key={c.id} style={s.entryBlock}>
                <Text style={s.bold}>{c.name}</Text>
                <Text style={s.muted}>{c.issued_by}</Text>
                <Text style={s.muted}>{c.issued_at}{c.expires_at ? ` — ${c.expires_at}` : ''}</Text>
              </View>
            ))}
          </>}

          {education.length > 0 && <>
            <Text style={s.sectionTitle}>Education</Text>
            <View style={s.rule} />
            {education.map(e => (
              <View key={e.id} style={s.entryBlock}>
                <Text style={s.bold}>{e.degree}{e.field ? ` in ${e.field}` : ''}</Text>
                <Text style={s.muted}>{e.institution}</Text>
                <Text style={s.muted}>{e.started_at} — {e.ended_at}</Text>
              </View>
            ))}
          </>}

          {references.length > 0 && <>
            <Text style={s.sectionTitle}>References</Text>
            <View style={s.rule} />
            {references.map(r => (
              <View key={r.id} style={s.entryBlock}>
                <Text style={s.bold}>{r.full_name}</Text>
                <Text style={s.muted}>{r.position}{r.company ? ` · ${r.company}` : ''}</Text>
                <Text style={s.muted}>{r.email}{r.phone ? ` · ${r.phone}` : ''}</Text>
              </View>
            ))}
          </>}
        </View>

        {watermark && (
          <Text style={s.watermark} fixed>SeaJob.io — Upgrade to Pro to remove watermark</Text>
        )}
      </Page>
    </Document>
  )
}
```

- [ ] **Step 4: Create `components/resume/pdf/template-modern.tsx`**

```tsx
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { PdfResumeData } from './types'

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#1e293b' },
  header: { marginBottom: 20, borderBottomWidth: 3, borderBottomColor: '#0f172a', paddingBottom: 12 },
  name: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#475569' },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 14, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 2, borderBottomColor: '#0f172a' },
  entryBlock: { marginBottom: 8 },
  bold: { fontFamily: 'Helvetica-Bold' },
  muted: { color: '#64748b', fontSize: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  watermark: { position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', color: '#cbd5e1', fontSize: 7 },
})

export function TemplateModern({ data }: { data: PdfResumeData }) {
  const { profile, resume, experience, certificates, education, languages, skills, references, watermark } = data

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.name}>{profile.full_name ?? 'Seafarer'}</Text>
          <Text style={s.subtitle}>{[profile.rank, profile.fleet_type].filter(Boolean).join(' · ')}</Text>
        </View>

        {resume.bio && <>
          <Text style={s.sectionTitle}>Profile</Text>
          <Text style={{ marginBottom: 8, lineHeight: 1.5 }}>{resume.bio}</Text>
        </>}

        {experience.length > 0 && <>
          <Text style={s.sectionTitle}>Sea Experience</Text>
          {experience.map(e => (
            <View key={e.id} style={s.entryBlock}>
              <Text style={s.bold}>{e.position} — {e.vessel_name}</Text>
              <Text style={s.muted}>{e.company}{e.flag ? ` · ${e.flag}` : ''} · {e.vessel_type}{e.grt ? ` · ${e.grt} GRT` : ''}</Text>
              <Text style={s.muted}>{e.started_at} — {e.ended_at ?? 'Present'}</Text>
            </View>
          ))}
        </>}

        {certificates.length > 0 && <>
          <Text style={s.sectionTitle}>Certificates</Text>
          {certificates.map(c => (
            <View key={c.id} style={s.entryBlock}>
              <Text style={s.bold}>{c.name}</Text>
              <Text style={s.muted}>{c.issued_by} · {c.issued_at}{c.expires_at ? ` — ${c.expires_at}` : ''}</Text>
            </View>
          ))}
        </>}

        {education.length > 0 && <>
          <Text style={s.sectionTitle}>Education</Text>
          {education.map(e => (
            <View key={e.id} style={s.entryBlock}>
              <Text style={s.bold}>{e.degree}{e.field ? ` in ${e.field}` : ''}</Text>
              <Text style={s.muted}>{e.institution} · {e.started_at} — {e.ended_at}</Text>
            </View>
          ))}
        </>}

        {(languages.length > 0 || skills.length > 0) && <>
          <Text style={s.sectionTitle}>Skills & Languages</Text>
          <View style={s.row}>
            {languages.map(l => <Text key={l.id} style={{ marginRight: 12 }}>{l.language} ({l.level})</Text>)}
            {skills.map(sk => <Text key={sk.id} style={{ marginRight: 12 }}>• {sk.name}</Text>)}
          </View>
        </>}

        {references.length > 0 && <>
          <Text style={s.sectionTitle}>References</Text>
          {references.map(r => (
            <View key={r.id} style={s.entryBlock}>
              <Text style={s.bold}>{r.full_name}</Text>
              <Text style={s.muted}>{r.position}{r.company ? ` · ${r.company}` : ''} · {r.email}{r.phone ? ` · ${r.phone}` : ''}</Text>
            </View>
          ))}
        </>}

        {(resume.availability_date || resume.contract_duration || resume.salary_expectation) && <>
          <Text style={s.sectionTitle}>Preferences</Text>
          <Text style={s.muted}>
            {[
              resume.availability_date ? `Available: ${resume.availability_date}` : null,
              resume.contract_duration ? `Contract: ${resume.contract_duration}` : null,
              resume.salary_expectation ? `Salary: ${resume.salary_expectation}` : null,
            ].filter(Boolean).join(' · ')}
          </Text>
        </>}

        {watermark && <Text style={s.watermark} fixed>SeaJob.io — Upgrade to Pro to remove watermark</Text>}
      </Page>
    </Document>
  )
}
```

- [ ] **Step 5: Create `components/resume/pdf/template-compact.tsx`**

```tsx
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { PdfResumeData } from './types'

const s = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: 'Helvetica', color: '#1e293b' },
  header: { marginBottom: 10 },
  name: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 8, color: '#475569', marginBottom: 8 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.6, color: '#475569', marginTop: 8, marginBottom: 2 },
  rule: { borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', marginBottom: 4 },
  entryBlock: { marginBottom: 5 },
  bold: { fontFamily: 'Helvetica-Bold' },
  muted: { color: '#64748b', fontSize: 7.5 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  watermark: { position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', color: '#cbd5e1', fontSize: 6.5 },
})

export function TemplateCompact({ data }: { data: PdfResumeData }) {
  const { profile, resume, experience, certificates, education, languages, skills, references, watermark } = data

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.name}>{profile.full_name ?? 'Seafarer'}</Text>
          <Text style={s.subtitle}>{[profile.rank, profile.fleet_type].filter(Boolean).join(' · ')}</Text>
        </View>

        {resume.bio && <>
          <Text style={s.sectionTitle}>Profile</Text>
          <View style={s.rule} />
          <Text style={{ marginBottom: 5, lineHeight: 1.4 }}>{resume.bio}</Text>
        </>}

        {experience.length > 0 && <>
          <Text style={s.sectionTitle}>Experience</Text>
          <View style={s.rule} />
          {experience.map(e => (
            <View key={e.id} style={s.entryBlock}>
              <Text style={s.bold}>{e.position} · {e.vessel_name}{e.flag ? ` (${e.flag})` : ''}</Text>
              <Text style={s.muted}>{e.company} · {e.vessel_type}{e.grt ? ` · ${e.grt} GRT` : ''} · {e.started_at} — {e.ended_at ?? 'Present'}</Text>
            </View>
          ))}
        </>}

        {certificates.length > 0 && <>
          <Text style={s.sectionTitle}>Certificates</Text>
          <View style={s.rule} />
          {certificates.map(c => (
            <View key={c.id} style={s.entryBlock}>
              <Text style={s.bold}>{c.name}</Text>
              <Text style={s.muted}>{c.issued_by} · {c.issued_at}{c.expires_at ? ` — ${c.expires_at}` : ''}</Text>
            </View>
          ))}
        </>}

        {education.length > 0 && <>
          <Text style={s.sectionTitle}>Education</Text>
          <View style={s.rule} />
          {education.map(e => (
            <View key={e.id} style={s.entryBlock}>
              <Text style={s.bold}>{e.degree}{e.field ? ` · ${e.field}` : ''}</Text>
              <Text style={s.muted}>{e.institution} · {e.started_at} — {e.ended_at}</Text>
            </View>
          ))}
        </>}

        {(languages.length > 0 || skills.length > 0) && <>
          <Text style={s.sectionTitle}>Languages & Skills</Text>
          <View style={s.rule} />
          <View style={s.row}>
            {languages.map(l => <Text key={l.id} style={{ marginRight: 10, marginBottom: 2 }}>{l.language} ({l.level})</Text>)}
            {skills.map(sk => <Text key={sk.id} style={{ marginRight: 10, marginBottom: 2 }}>• {sk.name}</Text>)}
          </View>
        </>}

        {references.length > 0 && <>
          <Text style={s.sectionTitle}>References</Text>
          <View style={s.rule} />
          {references.map(r => (
            <View key={r.id} style={s.entryBlock}>
              <Text style={s.bold}>{r.full_name} · {r.position}{r.company ? ` · ${r.company}` : ''}</Text>
              <Text style={s.muted}>{r.email}{r.phone ? ` · ${r.phone}` : ''}</Text>
            </View>
          ))}
        </>}

        {(resume.availability_date || resume.contract_duration || resume.salary_expectation) && <>
          <Text style={s.sectionTitle}>Preferences</Text>
          <View style={s.rule} />
          <Text style={s.muted}>
            {[
              resume.availability_date ? `Available: ${resume.availability_date}` : null,
              resume.contract_duration,
              resume.salary_expectation,
            ].filter(Boolean).join(' · ')}
          </Text>
        </>}

        {watermark && <Text style={s.watermark} fixed>SeaJob.io — Upgrade to Pro to remove watermark</Text>}
      </Page>
    </Document>
  )
}
```

- [ ] **Step 6: Create `app/api/resume/pdf/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { TemplateClassic } from '@/components/resume/pdf/template-classic'
import { TemplateModern } from '@/components/resume/pdf/template-modern'
import { TemplateCompact } from '@/components/resume/pdf/template-compact'
import type {
  Resume,
  ResumeExperience,
  ResumeCertificate,
  ResumeEducation,
  ResumeLanguage,
  ResumeSkill,
  ResumeReference,
} from '@/lib/supabase/types'
import type { PdfResumeData } from '@/components/resume/pdf/types'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const template = request.nextUrl.searchParams.get('template') ?? 'classic'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const [{ data: profile }, { data: resume }] = await Promise.all([
    supabase.from('profiles').select('full_name, rank, fleet_type, subscription_status').eq('id', user.id).single(),
    supabase.from('resumes').select('*').eq('user_id', user.id).single(),
  ])

  if (!resume) return NextResponse.json({ error: 'no_resume' }, { status: 400 })

  const isPro = profile?.subscription_status !== 'free'
  if (!isPro && template !== 'classic') {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 })
  }

  const [exp, certs, edu, langs, skills, refs] = await Promise.all([
    supabase.from('resume_experience').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_certificates').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_education').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_languages').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_skills').select('*').eq('resume_id', resume.id).order('sort_order'),
    supabase.from('resume_references').select('*').eq('resume_id', resume.id).order('sort_order'),
  ])

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
    watermark: !isPro,
  }

  const TemplateComponent =
    template === 'modern' ? TemplateModern :
    template === 'compact' ? TemplateCompact :
    TemplateClassic

  const buffer = await renderToBuffer(createElement(TemplateComponent, { data: pdfData }))

  const fullName = (profile?.full_name ?? 'seafarer').toLowerCase().replace(/\s+/g, '-')
  const month = new Date().toISOString().slice(0, 7)
  const filename = `seajob-cv-${fullName}-${month}.pdf`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

- [ ] **Step 7: Verify build**

```bash
npm run build
```

Expected: build succeeds. If `@react-pdf/renderer` causes module resolution errors, add to `next.config.js`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
}
module.exports = nextConfig
```

Then re-run `npm run build`.

- [ ] **Step 8: Commit**

```bash
git add components/resume/pdf/ app/api/resume/pdf/route.ts package.json package-lock.json next.config.js
git commit -m "feat: add PDF templates and generation route handler"
```

---

### Task 9: E2E Tests + Final Verification

**Files:**
- Create: `e2e/resume.spec.ts`

**Interfaces:**
- Consumes: the live dev server at `http://localhost:3000`

- [ ] **Step 1: Create `e2e/resume.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test('unauthenticated access to resume page redirects to login', async ({ page }) => {
  await page.goto('/en/dashboard/resume')
  await expect(page).toHaveURL(/\/en\/login/)
})

test('PDF endpoint returns 401 for unauthenticated request', async ({ request }) => {
  const response = await request.get('/api/resume/pdf?template=classic')
  expect(response.status()).toBe(401)
})

test('resume page loads for authenticated user', async ({ page, context }) => {
  // Skip if TEST_USER_EMAIL / TEST_USER_PASSWORD env vars not set
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD
  if (!email || !password) {
    test.skip()
    return
  }

  await page.goto('/en/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Log In' }).click()
  await page.waitForURL(/\/en\/dashboard/)

  await page.goto('/en/dashboard/resume')
  await expect(page.getByRole('heading', { name: 'My Resume' })).toBeVisible()
  await expect(page.getByText('Personal Info')).toBeVisible()
  await expect(page.getByText('Sea Experience')).toBeVisible()
})
```

- [ ] **Step 2: Run Playwright tests**

```bash
npx playwright test --project=chromium
```

Expected: first two tests pass. Third test is skipped unless env vars are set.

- [ ] **Step 3: Run full build**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Update handoff.md**

In `handoff.md`, update the Implementation Phases table:

```markdown
| **Resume Builder** | ✅ Complete | All tasks done, E2E tests passing |
```

Remove `hasResume hardcoded false` from Known Deferred Items.

- [ ] **Step 5: Commit**

```bash
git add e2e/resume.spec.ts handoff.md
git commit -m "feat: add resume E2E tests and mark phase complete"
```
