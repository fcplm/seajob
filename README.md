# SeaJob

A web platform for seafarers to simplify job searching. Build a professional CV, browse maritime vacancies, and send your resume to hundreds of employers in one click.

## Features

| Sub-system | Status | Description |
|---|---|---|
| Personal Dashboard | Done | Profile, subscription status, resume preview, analytics |
| Resume Builder | Planned | Quiz-based CV creation with PDF export |
| Vacancies Board | Planned | Job listings filtered by fleet type and rank |
| CV Sender | Planned | Bulk email to fleet-segmented employer databases |

## Tech Stack

- **Framework** — Next.js 14 App Router, TypeScript strict
- **Styling** — Tailwind CSS + shadcn/ui (Default/Slate/Radix UI)
- **i18n** — next-intl v4, `/en/` and `/ru/` URL routing
- **Database & Auth** — Supabase (PostgreSQL + RLS + Supabase Auth)
- **Testing** — Playwright (Chromium)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Set up Supabase

Run this SQL in your Supabase project's SQL editor:

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

Enable Google OAuth in Supabase → Auth → Providers. Set the redirect URL to:

```
http://localhost:3000/en/auth/callback
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/en/`.

## Commands

```bash
npm run dev                              # Development server
npm run build                            # Production build
npx playwright test --project=chromium   # E2E tests
```

## Locales

| URL prefix | Language |
|---|---|
| `/en/` | English |
| `/ru/` | Russian |

All user-facing strings live in `messages/en.json` and `messages/ru.json`. Never hardcode UI text.
