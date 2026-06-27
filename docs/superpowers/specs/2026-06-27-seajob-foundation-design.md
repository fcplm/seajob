# SeaJob — Foundation Design Spec

**Date:** 2026-06-27  
**Sub-project:** #1 of 4 — Foundation  
**Status:** Approved

---

## Context

SeaJob is a web platform for seafarers to simplify job search. It includes four sub-systems built sequentially:
1. **Foundation** (this spec) — project setup, auth, personal dashboard, landing page
2. **Resume Builder** — multi-step quiz, PDF export
3. **Vacancies Board** — job listings, filters, apply
4. **CV Sender** — bulk email to fleet-segmented databases

This spec covers sub-project #1 only. The others depend on Foundation being complete.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database + Auth | Supabase (PostgreSQL + Row Level Security) |
| Auth providers | Email/password + Google OAuth |
| i18n | next-intl (RU/EN, URL-based: `/ru/`, `/en/`) |
| Payments | Placeholder UI only in MVP (Stripe added later) |
| Deployment | Vercel |

---

## Architecture

Single Next.js monorepo — no separate backend. API logic lives in Next.js Route Handlers and Server Actions.

```
seajob/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx                  # Landing
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── dashboard/
│   │       ├── page.tsx              # Dashboard home
│   │       ├── profile/page.tsx
│   │       ├── resume/page.tsx
│   │       ├── vacancies/page.tsx
│   │       ├── sender/page.tsx
│   │       ├── notifications/page.tsx
│   │       └── settings/page.tsx
├── components/
│   ├── ui/                           # shadcn/ui primitives
│   ├── layout/                       # Header, Footer, Sidebar, BottomBar
│   └── dashboard/                    # Dashboard widgets
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client (cookies)
│   │   └── types.ts                  # Generated DB types
│   └── utils.ts
├── messages/
│   ├── en.json
│   └── ru.json
├── middleware.ts                     # i18n routing + auth guard
└── .env.local                        # NEXT_PUBLIC_SUPABASE_URL, keys, etc.
```

---

## Auth

**Providers:** Email + password (with email confirmation), Google OAuth via Supabase.

**Flow:**
```
Signup  → Supabase creates user → confirmation email sent
        → user confirms → redirect to /[locale]/dashboard

Login (email)  → Supabase verifies → session stored in cookie → /dashboard
Login (Google) → OAuth redirect → Supabase callback → session → /dashboard

Middleware: every request to /dashboard/* checks session
  → no session → redirect to /[locale]/login?redirect=<original_url>
  → has session → proceed
```

**Database — `profiles` table:**
```sql
profiles (
  id              uuid references auth.users primary key,
  full_name       text,
  rank            text,           -- e.g. "Captain", "Chief Engineer"
  fleet_type      text,           -- merchant | tanker | offshore | cruise
  phone           text,
  photo_url       text,
  subscription_status text default 'free',  -- free | pro | enterprise
  created_at      timestamptz default now()
)
```

Row Level Security enabled: users can only read/write their own row.  
Profile row created automatically via Supabase trigger on `auth.users` insert.

---

## Personal Dashboard

**Navigation:**
- Desktop: fixed sidebar (left)
- Mobile: bottom navigation bar

**Sidebar items:**
- Dashboard (home)
- Profile
- My Resume
- Vacancies
- CV Sender
- Notifications
- Settings

**Dashboard home widgets:**
1. **Profile card** — avatar, name, rank
2. **Subscription status** — badge (Free/Pro/Enterprise) + "Upgrade" button → pricing page placeholder
3. **Resume card** — if exists: preview + "Edit"; if not: "Create Resume" CTA
4. **Recent activity** — last job applications + last CV sends
5. **Send analytics** — total emails sent, segments covered (placeholder data in MVP)

---

## Landing Page

All sections fully localized (RU/EN). SEO: `generateMetadata()` per page with localized title/description.

**Sections (top to bottom):**

1. **Header** — Logo | Nav (Vacancies, Pricing, About) | Language switcher RU/EN | Login / Get Started
2. **Hero** — Headline, subheadline, primary CTA "Create free resume" → `/signup`
3. **How it works** — 3 steps: Create resume → Find vacancy → Send CV
4. **Features** — 3 cards: Resume Builder, Vacancy Board, CV Sender
5. **Who it's for** — Fleet type segments: Merchant / Tanker / Offshore / Cruise (icons)
6. **Pricing** — 3 tiers (Free / Pro / Enterprise), all buttons → "Coming soon" modal
7. **Footer** — Logo, links, contacts, © SeaJob

---

## Responsive Design

Adaptive from day one — no mobile-first or desktop-first bias. Key breakpoints: `sm` (640px), `md` (768px), `lg` (1024px). Tailwind responsive utilities throughout.

---

## Error Handling

- Auth errors: displayed inline on form fields (not toast), e.g. "Invalid email or password"
- Network errors: toast notification (shadcn/ui `<Sonner />`)
- 404/500: localized error pages at `app/[locale]/not-found.tsx` and `app/[locale]/error.tsx`

---

## Out of Scope (this sub-project)

- Resume builder form/quiz
- Vacancy listings and apply flow
- CV Sender email dispatch
- Real Stripe payment processing
- Admin panel

---

## Verification

1. `npm run dev` → landing loads at `/ru/` and `/en/` with correct translations
2. Sign up with email → confirmation email received → confirm → land on dashboard
3. Sign up / login with Google → land on dashboard
4. `/dashboard/*` without session → redirect to `/login`
5. All dashboard sidebar links navigate correctly
6. Dashboard home shows all widgets (with placeholder data)
7. Pricing "Upgrade" button → "Coming soon" modal
8. Language switcher toggles between `/ru/` and `/en/` preserving current path
9. Responsive: test at 375px, 768px, 1280px — no layout breaks
