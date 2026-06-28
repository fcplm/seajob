# Project Structure

```
seajob/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout — pass-through (no html/body)
│   ├── globals.css
│   ├── favicon.ico
│   ├── fonts/                    # Local Geist fonts
│   └── [locale]/                 # Locale segment — en | ru
│       ├── layout.tsx            # html/body, fonts, NextIntlClientProvider
│       ├── page.tsx              # Landing page
│       ├── login/page.tsx
│       ├── signup/page.tsx
│       ├── auth/
│       │   └── callback/route.ts # OAuth redirect handler
│       └── dashboard/            # Protected area (middleware guard)
│           ├── layout.tsx        # Sidebar + BottomBar shell
│           ├── page.tsx          # Dashboard home (widgets)
│           ├── profile/page.tsx  # Profile edit form
│           ├── settings/page.tsx # Language switcher, account options
│           ├── resume/page.tsx   # Placeholder → Resume Builder
│           ├── vacancies/page.tsx# Placeholder → Vacancies Board
│           ├── sender/page.tsx   # Placeholder → CV Sender
│           └── notifications/page.tsx
│
├── actions/
│   └── auth.ts                   # Server Actions: login, signup, logout, updateProfile
│
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   ├── layout/
│   │   ├── header.tsx            # Top nav with lang switcher (client)
│   │   ├── footer.tsx            # Footer links (client)
│   │   ├── sidebar.tsx           # Desktop sidebar, sticky (client, md+)
│   │   └── bottom-bar.tsx        # Mobile bottom nav (client, <md)
│   ├── dashboard/
│   │   ├── profile-card.tsx      # User avatar + name + rank (server)
│   │   ├── subscription-widget.tsx
│   │   ├── resume-widget.tsx
│   │   ├── activity-widget.tsx
│   │   └── analytics-widget.tsx
│   └── ui/                       # shadcn/ui primitives (auto-generated)
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       └── sonner.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # createBrowserClient (use in 'use client' components)
│   │   ├── server.ts             # createServerClient with cookie handlers (use in server components / actions)
│   │   └── types.ts              # Profile type, Database type
│   └── utils.ts                  # cn() helper (clsx + tailwind-merge)
│
├── i18n/
│   └── request.ts                # next-intl v4 config (requestLocale Promise API)
│
├── messages/
│   ├── en.json                   # English strings
│   └── ru.json                   # Russian strings
│
├── e2e/                          # Playwright tests
│   ├── auth.spec.ts
│   └── navigation.spec.ts
│
├── docs/
│   └── superpowers/
│       ├── specs/                # Design documents
│       └── plans/                # Implementation plans
│
├── middleware.ts                 # i18n routing + dashboard auth guard
├── next.config.mjs               # Wrapped with createNextIntlPlugin
├── tailwind.config.ts
├── tsconfig.json
├── playwright.config.ts
├── components.json               # shadcn/ui config (Default/Slate/Radix)
│
├── README.md                     # Setup and commands
├── STRUCTURE.md                  # This file
├── CLAUDE.md                     # AI assistant instructions
└── handoff.md                    # Session-to-session progress log
```

---

## Key Patterns

### Supabase client usage

| Context | Import |
|---|---|
| Server component / Server Action / Route Handler | `lib/supabase/server.ts` → `createClient()` |
| Client component (`'use client'`) | `lib/supabase/client.ts` → `createClient()` |

Never use the server client inside a client component, and vice versa.

### i18n

All user-visible text goes through `next-intl`. No hardcoded strings anywhere.

```tsx
// Server component
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('namespace')

// Client component
import { useTranslations } from 'next-intl'
const t = useTranslations('namespace')
```

Add every new key to **both** `messages/en.json` and `messages/ru.json`.

### Server Actions

All mutations (auth, profile updates, future CRUD) live in `actions/`. They use `'use server'`, call the Supabase **server** client, and return `{ error: string } | void` — never throw.

### Auth guard

`middleware.ts` protects every `/[locale]/dashboard/*` route. It calls `supabase.auth.getUser()` server-side and redirects unauthenticated requests to `/[locale]/login?redirect=<path>`. The `login()` action reads `?redirect=` and returns the user to their intended destination after sign-in.

### Component rendering

- Landing page sections → server components (SEO-friendly)
- Auth forms → client components (form state, Google OAuth button)
- Dashboard widgets → mix: `ProfileCard` is server, `SubscriptionWidget` and `ResumeWidget` are client (need `useLocale` for links)
- `Sidebar` and `BottomBar` → client (active link highlighting, logout form)

---

## i18n Namespaces

| Namespace | Used by |
|---|---|
| `nav` | Header |
| `hero`, `howItWorks`, `features`, `fleets`, `pricing`, `footer` | Landing page |
| `auth` | Login / signup forms |
| `dashboard` | All dashboard pages and widgets |
| `profile` | Profile edit page |
| `settings` | Settings page |
