# SeaJob Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundation of SeaJob — Next.js 14 project with RU/EN i18n, Supabase auth (email + Google), a landing page, and a full personal dashboard with placeholder sub-pages.

**Architecture:** Next.js 14 App Router monorepo. All API logic lives in Server Actions and Route Handlers. Supabase handles auth and the PostgreSQL database. next-intl handles locale routing at `/ru/` and `/en/`.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, next-intl, @supabase/ssr, Playwright (E2E tests), Sonner (toasts)

## Global Constraints

- Node.js ≥ 18.17
- Next.js 14 (App Router only — no Pages Router)
- TypeScript strict mode enabled
- All user-facing strings must exist in both `messages/en.json` and `messages/ru.json`
- Supabase project URL and anon key stored in `.env.local` only, never hardcoded
- Row Level Security must be enabled on all Supabase tables
- No Stripe integration in this plan — payment UI is placeholder only
- Working directory: `/Users/sergeymedinskiy/Documents/claude projects/web site for cv /`

---

## File Map

```
seajob/
├── app/
│   ├── globals.css
│   ├── layout.tsx                        # Root layout (html/body, fonts)
│   └── [locale]/
│       ├── layout.tsx                    # Locale layout + NextIntlClientProvider
│       ├── page.tsx                      # Landing page
│       ├── login/page.tsx
│       ├── signup/page.tsx
│       ├── auth/callback/route.ts        # OAuth callback handler
│       └── dashboard/
│           ├── layout.tsx                # Dashboard shell (sidebar + content)
│           ├── page.tsx                  # Dashboard home (widgets)
│           ├── profile/page.tsx
│           ├── resume/page.tsx
│           ├── vacancies/page.tsx
│           ├── sender/page.tsx
│           ├── notifications/page.tsx
│           └── settings/page.tsx
├── components/
│   ├── ui/                               # shadcn/ui (auto-generated, do not edit)
│   ├── layout/
│   │   ├── header.tsx                    # Landing header + lang switcher
│   │   ├── footer.tsx
│   │   ├── sidebar.tsx                   # Dashboard sidebar (desktop)
│   │   └── bottom-bar.tsx               # Dashboard nav (mobile)
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   └── dashboard/
│       ├── profile-card.tsx
│       ├── subscription-widget.tsx
│       ├── resume-widget.tsx
│       ├── activity-widget.tsx
│       └── analytics-widget.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Browser Supabase client
│   │   ├── server.ts                     # Server Supabase client (cookies)
│   │   └── types.ts                      # Generated DB types
│   └── utils.ts                          # cn() helper
├── actions/
│   └── auth.ts                           # Server Actions: login, signup, logout
├── messages/
│   ├── en.json
│   └── ru.json
├── i18n/
│   └── request.ts                        # next-intl server config
├── middleware.ts                          # i18n routing + auth guard
├── next.config.ts
├── tailwind.config.ts
├── .env.local.example
└── e2e/
    ├── auth.spec.ts
    └── navigation.spec.ts
```

---

### Task 1: Project Initialization

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `app/globals.css`, `app/layout.tsx`, `.env.local.example`, `.gitignore`, `lib/utils.ts`

**Interfaces:**
- Produces: `cn()` utility from `lib/utils.ts` — used by all components

- [ ] **Step 1: Scaffold Next.js project**

Run in the project root (the directory with `web page` file):
```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --use-npm
```
Answer prompts: accept all defaults. This overwrites the empty `web page` file — that's fine.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr next-intl sonner
npm install -D playwright @playwright/test
npx playwright install chromium
```

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init
```
Choose: Default style, Slate base color, yes to CSS variables.

Add components we need:
```bash
npx shadcn@latest add button card badge avatar separator sheet dialog toast
```

- [ ] **Step 4: Create `lib/utils.ts`**

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Install deps:
```bash
npm install clsx tailwind-merge
```

- [ ] **Step 5: Create `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Copy to `.env.local` and fill in real values from your Supabase project dashboard.

- [ ] **Step 6: Update `.gitignore`**

Ensure these lines exist (create-next-app adds most, verify `.env.local` is included):
```
.env.local
.env*.local
```

- [ ] **Step 7: Verify project starts**

```bash
npm run dev
```
Expected: Server starts at `http://localhost:3000`, browser shows Next.js default page. No TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 14 project with shadcn/ui and Supabase deps"
```

---

### Task 2: i18n Setup (next-intl)

**Files:**
- Create: `i18n/request.ts`, `messages/en.json`, `messages/ru.json`, `app/[locale]/layout.tsx`
- Modify: `next.config.ts`, `app/layout.tsx`

**Interfaces:**
- Produces: `useTranslations(namespace)` hook available in all `[locale]` components; locale values: `"en"` | `"ru"`

- [ ] **Step 1: Create `i18n/request.ts`**

```typescript
import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

const locales = ['en', 'ru'] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound()
  return {
    messages: (await import(`../messages/${locale}.json`)).default
  }
})
```

- [ ] **Step 2: Update `next.config.ts`**

```typescript
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {}

export default withNextIntl(nextConfig)
```

- [ ] **Step 3: Create `messages/en.json`**

```json
{
  "nav": {
    "vacancies": "Vacancies",
    "pricing": "Pricing",
    "about": "About",
    "login": "Log in",
    "getStarted": "Get Started"
  },
  "hero": {
    "headline": "Find Your Next Maritime Job — Fast",
    "subheadline": "Build your seafarer CV, browse vacancies, and send your resume to hundreds of employers in one click.",
    "cta": "Create Free Resume"
  },
  "howItWorks": {
    "title": "How It Works",
    "step1Title": "Build Your Resume",
    "step1Desc": "Fill in your seafarer profile using our guided builder.",
    "step2Title": "Find a Vacancy",
    "step2Desc": "Browse jobs filtered by fleet type and rank.",
    "step3Title": "Send Your CV",
    "step3Desc": "Blast your resume to hundreds of employers in seconds."
  },
  "features": {
    "title": "Everything You Need",
    "resumeTitle": "Resume Builder",
    "resumeDesc": "Professional maritime CV in minutes.",
    "vacanciesTitle": "Vacancy Board",
    "vacanciesDesc": "Curated jobs across all fleet types.",
    "senderTitle": "CV Sender",
    "senderDesc": "Reach hundreds of crewing managers instantly."
  },
  "fleets": {
    "title": "Built for Every Fleet",
    "merchant": "Merchant",
    "tanker": "Tanker",
    "offshore": "Offshore",
    "cruise": "Cruise"
  },
  "pricing": {
    "title": "Simple Pricing",
    "free": "Free",
    "pro": "Pro",
    "enterprise": "Enterprise",
    "comingSoon": "Coming Soon",
    "choosePlan": "Choose Plan"
  },
  "footer": {
    "tagline": "The job platform built for seafarers.",
    "links": "Links",
    "contact": "Contact",
    "rights": "All rights reserved."
  },
  "auth": {
    "email": "Email",
    "password": "Password",
    "fullName": "Full Name",
    "login": "Log In",
    "signup": "Sign Up",
    "loginTitle": "Welcome back",
    "signupTitle": "Create your account",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?",
    "signupLink": "Sign up",
    "loginLink": "Log in",
    "continueWithGoogle": "Continue with Google",
    "checkEmail": "Check your email to confirm your account.",
    "invalidCredentials": "Invalid email or password.",
    "emailInUse": "An account with this email already exists."
  },
  "dashboard": {
    "home": "Dashboard",
    "profile": "Profile",
    "resume": "My Resume",
    "vacancies": "Vacancies",
    "sender": "CV Sender",
    "notifications": "Notifications",
    "settings": "Settings",
    "logout": "Log Out",
    "subscriptionStatus": "Subscription",
    "upgrade": "Upgrade",
    "free": "Free",
    "pro": "Pro",
    "enterprise": "Enterprise",
    "createResume": "Create Resume",
    "editResume": "Edit Resume",
    "noResume": "You haven't created a resume yet.",
    "recentActivity": "Recent Activity",
    "noActivity": "No activity yet.",
    "sendAnalytics": "Send Analytics",
    "emailsSent": "Emails Sent",
    "segmentsReached": "Segments Reached",
    "comingSoon": "Coming soon"
  },
  "profile": {
    "title": "My Profile",
    "fullName": "Full Name",
    "rank": "Rank",
    "fleetType": "Fleet Type",
    "phone": "Phone",
    "save": "Save Changes",
    "saved": "Changes saved.",
    "merchant": "Merchant",
    "tanker": "Tanker",
    "offshore": "Offshore",
    "cruise": "Cruise"
  },
  "settings": {
    "title": "Settings",
    "language": "Language",
    "changePassword": "Change Password",
    "deleteAccount": "Delete Account",
    "deleteWarning": "This action cannot be undone."
  }
}
```

- [ ] **Step 4: Create `messages/ru.json`**

```json
{
  "nav": {
    "vacancies": "Вакансии",
    "pricing": "Цены",
    "about": "О нас",
    "login": "Войти",
    "getStarted": "Начать"
  },
  "hero": {
    "headline": "Найди работу в море — быстро и просто",
    "subheadline": "Создай резюме моряка, просматривай вакансии и отправляй CV сотням работодателей в один клик.",
    "cta": "Создать резюме бесплатно"
  },
  "howItWorks": {
    "title": "Как это работает",
    "step1Title": "Создай резюме",
    "step1Desc": "Заполни профиль моряка с помощью нашего конструктора.",
    "step2Title": "Найди вакансию",
    "step2Desc": "Просматривай вакансии по типу флота и должности.",
    "step3Title": "Отправь CV",
    "step3Desc": "Разошли резюме сотням работодателей за секунды."
  },
  "features": {
    "title": "Всё что нужно",
    "resumeTitle": "Конструктор резюме",
    "resumeDesc": "Профессиональное CV моряка за несколько минут.",
    "vacanciesTitle": "Доска вакансий",
    "vacanciesDesc": "Актуальные вакансии по всем типам флота.",
    "senderTitle": "CV Sender",
    "senderDesc": "Достучись до сотен крюинговых менеджеров мгновенно."
  },
  "fleets": {
    "title": "Для любого флота",
    "merchant": "Торговый",
    "tanker": "Танкерный",
    "offshore": "Оффшор",
    "cruise": "Круизный"
  },
  "pricing": {
    "title": "Простые тарифы",
    "free": "Бесплатно",
    "pro": "Pro",
    "enterprise": "Корпоратив",
    "comingSoon": "Скоро",
    "choosePlan": "Выбрать"
  },
  "footer": {
    "tagline": "Платформа поиска работы для моряков.",
    "links": "Ссылки",
    "contact": "Контакты",
    "rights": "Все права защищены."
  },
  "auth": {
    "email": "Email",
    "password": "Пароль",
    "fullName": "Полное имя",
    "login": "Войти",
    "signup": "Зарегистрироваться",
    "loginTitle": "С возвращением",
    "signupTitle": "Создать аккаунт",
    "noAccount": "Нет аккаунта?",
    "hasAccount": "Уже есть аккаунт?",
    "signupLink": "Зарегистрироваться",
    "loginLink": "Войти",
    "continueWithGoogle": "Войти через Google",
    "checkEmail": "Проверь email для подтверждения аккаунта.",
    "invalidCredentials": "Неверный email или пароль.",
    "emailInUse": "Аккаунт с этим email уже существует."
  },
  "dashboard": {
    "home": "Кабинет",
    "profile": "Профиль",
    "resume": "Моё резюме",
    "vacancies": "Вакансии",
    "sender": "CV Sender",
    "notifications": "Уведомления",
    "settings": "Настройки",
    "logout": "Выйти",
    "subscriptionStatus": "Подписка",
    "upgrade": "Улучшить",
    "free": "Бесплатно",
    "pro": "Pro",
    "enterprise": "Корпоратив",
    "createResume": "Создать резюме",
    "editResume": "Редактировать резюме",
    "noResume": "Вы ещё не создали резюме.",
    "recentActivity": "Последняя активность",
    "noActivity": "Активности пока нет.",
    "sendAnalytics": "Аналитика отправок",
    "emailsSent": "Писем отправлено",
    "segmentsReached": "Сегментов охвачено",
    "comingSoon": "Скоро"
  },
  "profile": {
    "title": "Мой профиль",
    "fullName": "Полное имя",
    "rank": "Должность",
    "fleetType": "Тип флота",
    "phone": "Телефон",
    "save": "Сохранить изменения",
    "saved": "Изменения сохранены.",
    "merchant": "Торговый",
    "tanker": "Танкерный",
    "offshore": "Оффшор",
    "cruise": "Круизный"
  },
  "settings": {
    "title": "Настройки",
    "language": "Язык",
    "changePassword": "Изменить пароль",
    "deleteAccount": "Удалить аккаунт",
    "deleteWarning": "Это действие нельзя отменить."
  }
}
```

- [ ] **Step 5: Create `app/layout.tsx` (root — no locale)**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'SeaJob',
  description: 'Maritime job platform for seafarers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 6: Create `app/[locale]/layout.tsx`**

```typescript
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Toaster } from 'sonner'

const locales = ['en', 'ru']

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!locales.includes(locale)) notFound()
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
      <Toaster position="top-right" />
    </NextIntlClientProvider>
  )
}
```

- [ ] **Step 7: Verify i18n routing**

```bash
npm run dev
```
Visit `http://localhost:3000/en` and `http://localhost:3000/ru` — both should load without errors (404 is fine for now, no pages yet).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add next-intl i18n with RU/EN message files"
```

---

### Task 3: Supabase Setup

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/types.ts`

**Interfaces:**
- Produces: `createClient()` (browser, from `lib/supabase/client.ts`), `createServerClient()` (server, from `lib/supabase/server.ts`), `Database` type (from `lib/supabase/types.ts`)

- [ ] **Step 1: Create `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create `lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create `lib/supabase/types.ts`**

```typescript
export type Profile = {
  id: string
  full_name: string | null
  rank: string | null
  fleet_type: 'merchant' | 'tanker' | 'offshore' | 'cruise' | null
  phone: string | null
  photo_url: string | null
  subscription_status: 'free' | 'pro' | 'enterprise'
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
    }
  }
}
```

- [ ] **Step 4: Run SQL in Supabase Dashboard**

Go to your Supabase project → SQL Editor → run:

```sql
-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  rank text,
  fleet_type text check (fleet_type in ('merchant', 'tanker', 'offshore', 'cruise')),
  phone text,
  photo_url text,
  subscription_status text not null default 'free'
    check (subscription_status in ('free', 'pro', 'enterprise')),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policy: users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Policy: users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Policy: users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 5: Enable Google OAuth in Supabase**

In Supabase Dashboard → Authentication → Providers → Google:
1. Enable Google provider
2. Add your Google OAuth Client ID and Secret (create at console.cloud.google.com)
3. Copy the callback URL shown and add it to your Google OAuth app's authorized redirect URIs

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Supabase client, server client, types, and DB schema"
```

---

### Task 4: Middleware (i18n + Auth Guard)

**Files:**
- Create: `middleware.ts`

**Interfaces:**
- Consumes: Supabase session cookie, `next-intl` middleware
- Produces: All `/[locale]/dashboard/*` routes require a valid session; locale is injected into every request

- [ ] **Step 1: Create `middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware({
  locales: ['en', 'ru'],
  defaultLocale: 'en',
  localePrefix: 'always',
})

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Run i18n middleware first
  const response = intlMiddleware(request)

  // Detect locale from pathname
  const locale = pathname.startsWith('/ru') ? 'ru' : 'en'

  // Auth guard: protect /[locale]/dashboard/*
  const isDashboard = pathname.match(/^\/(en|ru)\/dashboard/)
  if (!isDashboard) return response

  // Check Supabase session
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL(`/${locale}/login`, request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
```

- [ ] **Step 2: Verify middleware runs**

```bash
npm run dev
```
Visit `http://localhost:3000/en/dashboard` — should redirect to `/en/login?redirect=/en/dashboard`. Check browser network tab to confirm redirect.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware with i18n routing and dashboard auth guard"
```

---

### Task 5: Auth Pages and Server Actions

**Files:**
- Create: `actions/auth.ts`, `components/auth/login-form.tsx`, `components/auth/signup-form.tsx`, `app/[locale]/login/page.tsx`, `app/[locale]/signup/page.tsx`, `app/[locale]/auth/callback/route.ts`

**Interfaces:**
- Consumes: `createClient()` from `lib/supabase/server.ts` (in actions), `createClient()` from `lib/supabase/client.ts` (in components for Google OAuth)
- Produces: authenticated Supabase session stored in cookies; user redirected to `/[locale]/dashboard` on success

- [ ] **Step 1: Create `actions/auth.ts`**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData, locale: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: 'invalidCredentials' }
  revalidatePath('/', 'layout')
  redirect(`/${locale}/dashboard`)
}

export async function signup(formData: FormData, locale: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: { full_name: formData.get('fullName') as string },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/auth/callback`,
    },
  })
  if (error?.message?.includes('already registered')) return { error: 'emailInUse' }
  if (error) return { error: 'invalidCredentials' }
  return { success: 'checkEmail' }
}

export async function logout(locale: string) {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect(`/${locale}/login`)
}
```

- [ ] **Step 2: Create `app/[locale]/auth/callback/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { locale: string } }
) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const locale = params.locale

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
}
```

- [ ] **Step 3: Create `components/auth/login-form.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { login } from '@/actions/auth'

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations('auth')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await login(formData, locale)
    if (result?.error) {
      setError(t(result.error as any))
      setLoading(false)
    }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-center">{t('loginTitle')}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="password">{t('password')}</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? '...' : t('login')}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>
      <Button variant="outline" onClick={handleGoogle}>
        {t('continueWithGoogle')}
      </Button>
      <p className="text-sm text-center text-muted-foreground">
        {t('noAccount')}{' '}
        <a href={`/${locale}/signup`} className="underline">{t('signupLink')}</a>
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Create `components/auth/signup-form.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { signup } from '@/actions/auth'

export function SignupForm({ locale }: { locale: string }) {
  const t = useTranslations('auth')
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    const result = await signup(formData, locale)
    setLoading(false)
    if (result?.error) setMessage({ type: 'error', text: t(result.error as any) })
    if (result?.success) setMessage({ type: 'success', text: t(result.success as any) })
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/${locale}/auth/callback` },
    })
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-center">{t('signupTitle')}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="fullName">{t('fullName')}</Label>
          <Input id="fullName" name="fullName" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="password">{t('password')}</Label>
          <Input id="password" name="password" type="password" minLength={6} required />
        </div>
        {message && (
          <p className={`text-sm ${message.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? '...' : t('signup')}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>
      <Button variant="outline" onClick={handleGoogle}>
        {t('continueWithGoogle')}
      </Button>
      <p className="text-sm text-center text-muted-foreground">
        {t('hasAccount')}{' '}
        <a href={`/${locale}/login`} className="underline">{t('loginLink')}</a>
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Create `app/[locale]/login/page.tsx`**

```typescript
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <LoginForm locale={locale} />
    </main>
  )
}
```

- [ ] **Step 6: Create `app/[locale]/signup/page.tsx`**

```typescript
import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <SignupForm locale={locale} />
    </main>
  )
}
```

- [ ] **Step 7: Write E2E test**

Create `e2e/auth.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

test('signup page loads', async ({ page }) => {
  await page.goto('/en/signup')
  await expect(page.getByRole('heading')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Password')).toBeVisible()
})

test('login page loads', async ({ page }) => {
  await page.goto('/en/login')
  await expect(page.getByRole('heading')).toBeVisible()
})

test('dashboard redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/en/dashboard')
  await expect(page).toHaveURL(/\/en\/login/)
})
```

Create `playwright.config.ts` if not exists:
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
})
```

- [ ] **Step 8: Run tests**

```bash
npm run dev &
npx playwright test e2e/auth.spec.ts
```
Expected: All 3 tests pass.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add auth pages, server actions, Google OAuth, and E2E tests"
```

---

### Task 6: Landing Page

**Files:**
- Create: `components/layout/header.tsx`, `components/layout/footer.tsx`, `app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `useTranslations` from next-intl
- Produces: Landing page at `/en` and `/ru` with all sections

- [ ] **Step 1: Create `components/layout/header.tsx`**

```typescript
'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Header() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function toggleLocale() {
    const next = locale === 'en' ? 'ru' : 'en'
    const withoutLocale = pathname.replace(/^\/(en|ru)/, '')
    router.push(`/${next}${withoutLocale}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="text-xl font-bold">
          SeaJob
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href={`/${locale}#vacancies`} className="text-muted-foreground hover:text-foreground">
            {t('vacancies')}
          </Link>
          <Link href={`/${locale}#pricing`} className="text-muted-foreground hover:text-foreground">
            {t('pricing')}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleLocale}>
            {locale === 'en' ? 'RU' : 'EN'}
          </Button>
          <Link href={`/${locale}/login`}>
            <Button variant="ghost" size="sm">{t('login')}</Button>
          </Link>
          <Link href={`/${locale}/signup`}>
            <Button size="sm">{t('getStarted')}</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create `components/layout/footer.tsx`**

```typescript
'use client'

import { useTranslations, useLocale } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  const locale = useLocale()

  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="font-bold text-lg">SeaJob</p>
          <p className="text-sm text-muted-foreground mt-1">{t('tagline')}</p>
        </div>
        <div>
          <p className="font-semibold mb-2">{t('links')}</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li><a href={`/${locale}#features`} className="hover:underline">Features</a></li>
            <li><a href={`/${locale}#pricing`} className="hover:underline">{t('links')}</a></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-2">{t('contact')}</p>
          <p className="text-sm text-muted-foreground">contact@seajob.io</p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SeaJob. {t('rights')}
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Create `app/[locale]/page.tsx`**

```typescript
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import type { Metadata } from 'next'

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'hero' })
  return { title: `SeaJob — ${t('headline')}`, description: t('subheadline') }
}

function HeroSection({ locale }: { locale: string }) {
  const t = useTranslations('hero')
  return (
    <section className="py-24 px-4 text-center bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{t('headline')}</h1>
        <p className="text-xl text-muted-foreground mb-10">{t('subheadline')}</p>
        <Link href={`/${locale}/signup`}>
          <Button size="lg" className="text-base px-8">{t('cta')}</Button>
        </Link>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const t = useTranslations('howItWorks')
  const steps = [
    { num: '01', title: t('step1Title'), desc: t('step1Desc') },
    { num: '02', title: t('step2Title'), desc: t('step2Desc') },
    { num: '03', title: t('step3Title'), desc: t('step3Desc') },
  ]
  return (
    <section className="py-20 px-4" id="how-it-works">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t('title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center text-center gap-3">
              <span className="text-5xl font-bold text-muted-foreground/30">{s.num}</span>
              <h3 className="font-semibold text-lg">{s.title}</h3>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const t = useTranslations('features')
  const features = [
    { title: t('resumeTitle'), desc: t('resumeDesc'), icon: '📄' },
    { title: t('vacanciesTitle'), desc: t('vacanciesDesc'), icon: '🔍' },
    { title: t('senderTitle'), desc: t('senderDesc'), icon: '📧' },
  ]
  return (
    <section className="py-20 px-4 bg-muted/30" id="features">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t('title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <div className="text-4xl mb-2">{f.icon}</div>
                <CardTitle>{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function FleetsSection() {
  const t = useTranslations('fleets')
  const fleets = [
    { key: 'merchant', icon: '🚢' },
    { key: 'tanker', icon: '🛢️' },
    { key: 'offshore', icon: '⚓' },
    { key: 'cruise', icon: '🛳️' },
  ] as const
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-12">{t('title')}</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {fleets.map((f) => (
            <div key={f.key} className="flex flex-col items-center gap-2 p-6 rounded-xl border bg-card w-36">
              <span className="text-4xl">{f.icon}</span>
              <span className="font-medium">{t(f.key)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingSection({ locale }: { locale: string }) {
  const t = useTranslations('pricing')
  const tiers = [
    { key: 'free', price: '$0', features: ['Resume Builder', '5 Job Applications'] },
    { key: 'pro', price: '$19/mo', features: ['Everything in Free', 'CV Sender (100 emails)', 'Priority Support'], highlight: true },
    { key: 'enterprise', price: '$49/mo', features: ['Everything in Pro', 'Unlimited CV Sends', 'Dedicated Manager'] },
  ] as const
  return (
    <section className="py-20 px-4 bg-muted/30" id="pricing">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t('title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <Card key={tier.key} className={tier.highlight ? 'border-primary shadow-lg' : ''}>
              <CardHeader>
                {tier.highlight && <Badge className="w-fit mb-2">Popular</Badge>}
                <CardTitle>{t(tier.key)}</CardTitle>
                <p className="text-2xl font-bold">{tier.price}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="text-sm text-muted-foreground space-y-1">
                  {tier.features.map((f) => <li key={f}>✓ {f}</li>)}
                </ul>
                <Button variant={tier.highlight ? 'default' : 'outline'} disabled>
                  {t('comingSoon')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <>
      <Header />
      <main>
        <HeroSection locale={locale} />
        <HowItWorksSection />
        <FeaturesSection />
        <FleetsSection />
        <PricingSection locale={locale} />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 4: Verify landing page**

```bash
npm run dev
```
Check `http://localhost:3000/en` and `http://localhost:3000/ru`. Both should render all sections. Language switcher in header should toggle between locales.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add landing page with all sections and lang switcher"
```

---

### Task 7: Dashboard Layout

**Files:**
- Create: `components/layout/sidebar.tsx`, `components/layout/bottom-bar.tsx`, `app/[locale]/dashboard/layout.tsx`

**Interfaces:**
- Consumes: `logout` action from `actions/auth.ts`, `useTranslations('dashboard')`
- Produces: Dashboard shell — sidebar on desktop, bottom bar on mobile; `children` rendered in content area

- [ ] **Step 1: Create `components/layout/sidebar.tsx`**

```typescript
'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logout } from '@/actions/auth'
import { Button } from '@/components/ui/button'

const navItems = [
  { key: 'home' as const, path: '', icon: '🏠' },
  { key: 'profile' as const, path: '/profile', icon: '👤' },
  { key: 'resume' as const, path: '/resume', icon: '📄' },
  { key: 'vacancies' as const, path: '/vacancies', icon: '🔍' },
  { key: 'sender' as const, path: '/sender', icon: '📧' },
  { key: 'notifications' as const, path: '/notifications', icon: '🔔' },
  { key: 'settings' as const, path: '/settings', icon: '⚙️' },
]

export function Sidebar() {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 border-r h-screen sticky top-0 bg-background">
      <div className="p-4 border-b">
        <Link href={`/${locale}`} className="font-bold text-lg">SeaJob</Link>
      </div>
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {navItems.map((item) => {
          const href = `/${locale}/dashboard${item.path}`
          const isActive = item.path === ''
            ? pathname === `/${locale}/dashboard`
            : pathname.startsWith(href)
          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span>{item.icon}</span>
              {t(item.key)}
            </Link>
          )
        })}
      </nav>
      <div className="p-2 border-t">
        <form action={() => logout(locale)}>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" type="submit">
            <span>🚪</span> {t('logout')}
          </Button>
        </form>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create `components/layout/bottom-bar.tsx`**

```typescript
'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const mobileItems = [
  { key: 'home' as const, path: '', icon: '🏠' },
  { key: 'resume' as const, path: '/resume', icon: '📄' },
  { key: 'vacancies' as const, path: '/vacancies', icon: '🔍' },
  { key: 'sender' as const, path: '/sender', icon: '📧' },
  { key: 'profile' as const, path: '/profile', icon: '👤' },
]

export function BottomBar() {
  const t = useTranslations('dashboard')
  const locale = useLocale()
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
      <div className="flex justify-around py-2">
        {mobileItems.map((item) => {
          const href = `/${locale}/dashboard${item.path}`
          const isActive = item.path === ''
            ? pathname === `/${locale}/dashboard`
            : pathname.startsWith(href)
          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 text-xs px-3 py-1',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              {t(item.key)}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Create `app/[locale]/dashboard/layout.tsx`**

```typescript
import { Sidebar } from '@/components/layout/sidebar'
import { BottomBar } from '@/components/layout/bottom-bar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 pb-20 md:pb-6">
        {children}
      </main>
      <BottomBar />
    </div>
  )
}
```

- [ ] **Step 4: Write E2E navigation test**

Add to `e2e/navigation.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

test('landing page loads at /en', async ({ page }) => {
  await page.goto('/en')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('SeaJob')).toBeVisible()
})

test('landing page loads at /ru', async ({ page }) => {
  await page.goto('/ru')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('login page is accessible', async ({ page }) => {
  await page.goto('/en/login')
  await expect(page).toHaveURL('/en/login')
})
```

- [ ] **Step 5: Run tests**

```bash
npx playwright test e2e/navigation.spec.ts
```
Expected: all 3 pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add dashboard layout with sidebar and mobile bottom bar"
```

---

### Task 8: Dashboard Home Widgets

**Files:**
- Create: `components/dashboard/profile-card.tsx`, `components/dashboard/subscription-widget.tsx`, `components/dashboard/resume-widget.tsx`, `components/dashboard/activity-widget.tsx`, `components/dashboard/analytics-widget.tsx`, `app/[locale]/dashboard/page.tsx`

**Interfaces:**
- Consumes: Supabase `profiles` table via `createClient()` from `lib/supabase/server.ts`; `Profile` type from `lib/supabase/types.ts`
- Produces: Dashboard home page displaying all 5 widgets with real profile data

- [ ] **Step 1: Create `components/dashboard/profile-card.tsx`**

```typescript
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Profile } from '@/lib/supabase/types'

export function ProfileCard({ profile }: { profile: Profile }) {
  const initials = (profile.full_name ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16">
        <AvatarImage src={profile.photo_url ?? undefined} />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold text-lg">{profile.full_name ?? '—'}</p>
        <p className="text-muted-foreground text-sm capitalize">{profile.rank ?? '—'}</p>
        <p className="text-muted-foreground text-sm capitalize">{profile.fleet_type ?? '—'}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/dashboard/subscription-widget.tsx`**

```typescript
'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import type { Profile } from '@/lib/supabase/types'

export function SubscriptionWidget({ status }: { status: Profile['subscription_status'] }) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{t('subscriptionStatus')}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <Badge variant={status === 'free' ? 'secondary' : 'default'} className="capitalize text-base px-3 py-1">
          {t(status)}
        </Badge>
        {status === 'free' && (
          <Link href={`/${locale}#pricing`}>
            <Button size="sm">{t('upgrade')}</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create `components/dashboard/resume-widget.tsx`**

```typescript
'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function ResumeWidget({ hasResume }: { hasResume: boolean }) {
  const t = useTranslations('dashboard')
  const locale = useLocale()

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{t('resume')}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {hasResume ? '✓ Resume created' : t('noResume')}
        </p>
        <Link href={`/${locale}/dashboard/resume`}>
          <Button size="sm" variant={hasResume ? 'outline' : 'default'}>
            {hasResume ? t('editResume') : t('createResume')}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Create `components/dashboard/activity-widget.tsx`**

```typescript
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ActivityWidget() {
  const t = useTranslations('dashboard')
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{t('recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{t('noActivity')}</p>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Create `components/dashboard/analytics-widget.tsx`**

```typescript
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AnalyticsWidget() {
  const t = useTranslations('dashboard')
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{t('sendAnalytics')}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">{t('emailsSent')}</p>
        </div>
        <div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">{t('segmentsReached')}</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 6: Create `app/[locale]/dashboard/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileCard } from '@/components/dashboard/profile-card'
import { SubscriptionWidget } from '@/components/dashboard/subscription-widget'
import { ResumeWidget } from '@/components/dashboard/resume-widget'
import { ActivityWidget } from '@/components/dashboard/activity-widget'
import { AnalyticsWidget } from '@/components/dashboard/analytics-widget'

export default async function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect(`/${locale}/login`)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <ProfileCard profile={profile} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubscriptionWidget status={profile.subscription_status} />
        <ResumeWidget hasResume={false} />
        <ActivityWidget />
        <AnalyticsWidget />
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Verify dashboard home**

```bash
npm run dev
```
Log in at `http://localhost:3000/en/login`, then go to `/en/dashboard`. All 4 widgets visible, profile card shows user's name from Supabase.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add dashboard home with profile, subscription, resume, and analytics widgets"
```

---

### Task 9: Dashboard Sub-pages

**Files:**
- Create: `app/[locale]/dashboard/profile/page.tsx`, `app/[locale]/dashboard/settings/page.tsx`, `app/[locale]/dashboard/resume/page.tsx`, `app/[locale]/dashboard/vacancies/page.tsx`, `app/[locale]/dashboard/sender/page.tsx`, `app/[locale]/dashboard/notifications/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `lib/supabase/server.ts`, `updateProfile` server action
- Produces: Profile edit form (functional), settings page (functional), 4 placeholder pages for future sub-projects

- [ ] **Step 1: Add `updateProfile` to `actions/auth.ts`**

Append to the existing file:
```typescript
export async function updateProfile(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: formData.get('full_name') as string,
      rank: formData.get('rank') as string,
      fleet_type: formData.get('fleet_type') as 'merchant' | 'tanker' | 'offshore' | 'cruise',
      phone: formData.get('phone') as string,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}
```

- [ ] **Step 2: Create `app/[locale]/dashboard/profile/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { updateProfile } from '@/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'
import type { Profile } from '@/lib/supabase/types'

export default function ProfilePage() {
  const t = useTranslations('profile')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data))
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)
    setLoading(false)
    if (result?.error) toast.error(result.error)
    else toast.success(t('saved'))
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="full_name">{t('fullName')}</Label>
          <Input id="full_name" name="full_name" defaultValue={profile?.full_name ?? ''} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="rank">{t('rank')}</Label>
          <Input id="rank" name="rank" defaultValue={profile?.rank ?? ''} />
        </div>
        <div className="flex flex-col gap-1">
          <Label>{t('fleetType')}</Label>
          <Select name="fleet_type" defaultValue={profile?.fleet_type ?? ''}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="merchant">{t('merchant')}</SelectItem>
              <SelectItem value="tanker">{t('tanker')}</SelectItem>
              <SelectItem value="offshore">{t('offshore')}</SelectItem>
              <SelectItem value="cruise">{t('cruise')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="phone">{t('phone')}</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={profile?.phone ?? ''} />
        </div>
        <Button type="submit" disabled={loading} className="w-fit">
          {loading ? '...' : t('save')}
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/[locale]/dashboard/settings/page.tsx`**

```typescript
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default async function SettingsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations('settings')

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <Separator />
      <div className="space-y-2">
        <p className="font-medium">{t('language')}</p>
        <div className="flex gap-2">
          <a href={`/en/dashboard/settings`}>
            <Button variant={locale === 'en' ? 'default' : 'outline'} size="sm">EN</Button>
          </a>
          <a href={`/ru/dashboard/settings`}>
            <Button variant={locale === 'ru' ? 'default' : 'outline'} size="sm">RU</Button>
          </a>
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <p className="font-medium text-red-500">{t('deleteAccount')}</p>
        <p className="text-sm text-muted-foreground">{t('deleteWarning')}</p>
        <Button variant="destructive" size="sm" disabled>{t('deleteAccount')}</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create placeholder pages**

`app/[locale]/dashboard/resume/page.tsx`:
```typescript
import { getTranslations } from 'next-intl/server'

export default async function ResumePage() {
  const t = await getTranslations('dashboard')
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
      <span className="text-4xl">📄</span>
      <p className="font-medium">{t('resume')}</p>
      <p className="text-sm">{t('comingSoon')}</p>
    </div>
  )
}
```

`app/[locale]/dashboard/vacancies/page.tsx`:
```typescript
import { getTranslations } from 'next-intl/server'

export default async function VacanciesPage() {
  const t = await getTranslations('dashboard')
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
      <span className="text-4xl">🔍</span>
      <p className="font-medium">{t('vacancies')}</p>
      <p className="text-sm">{t('comingSoon')}</p>
    </div>
  )
}
```

`app/[locale]/dashboard/sender/page.tsx`:
```typescript
import { getTranslations } from 'next-intl/server'

export default async function SenderPage() {
  const t = await getTranslations('dashboard')
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
      <span className="text-4xl">📧</span>
      <p className="font-medium">{t('sender')}</p>
      <p className="text-sm">{t('comingSoon')}</p>
    </div>
  )
}
```

`app/[locale]/dashboard/notifications/page.tsx`:
```typescript
import { getTranslations } from 'next-intl/server'

export default async function NotificationsPage() {
  const t = await getTranslations('dashboard')
  return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
      <span className="text-4xl">🔔</span>
      <p className="font-medium">{t('notifications')}</p>
      <p className="text-sm">{t('noActivity')}</p>
    </div>
  )
}
```

- [ ] **Step 5: Add Select component from shadcn**

```bash
npx shadcn@latest add select separator
```

- [ ] **Step 6: Verify all dashboard pages**

```bash
npm run dev
```
Log in and navigate through all sidebar links — each page loads without errors. Profile form fills with existing data and saves.

- [ ] **Step 7: Final E2E test run**

```bash
npx playwright test
```
Expected: all tests pass.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: add dashboard sub-pages — profile edit, settings, and placeholder pages"
```

---

## Verification Checklist

After all tasks complete, verify end-to-end:

- [ ] `http://localhost:3000` → redirects to `/en` (default locale)
- [ ] `/en` and `/ru` → landing page with all sections renders correctly
- [ ] Language switcher in header toggles locale and preserves path
- [ ] `/en/signup` → fill form → receive confirmation email → confirm → land on `/en/dashboard`
- [ ] Login with Google → land on `/en/dashboard`
- [ ] `/en/dashboard` without session → redirect to `/en/login?redirect=/en/dashboard`
- [ ] Dashboard sidebar all links navigate correctly (desktop)
- [ ] Bottom bar visible on mobile (375px width) with key nav items
- [ ] Profile page loads user data and saves changes
- [ ] Settings page language switcher toggles locale
- [ ] Pricing "Coming soon" buttons are disabled
- [ ] All Playwright tests pass: `npx playwright test`
