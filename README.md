# Pressure — Boxing Training Platform

Free, web-first boxing training that serves **total beginners** and **experienced boxers / pros** in one place. No app download, no proprietary hardware — just step in and train.

> **Train like a fighter. Look like an athlete.**

Landing page, a game-like onboarding flow, real accounts (Supabase), an AI coach that rates your chances and builds a roadmap (Claude), and English/Russian localization. **It runs with zero keys** — auth shows a "not connected" notice and the AI uses a built-in engine until you add credentials. See **[SETUP.md](SETUP.md)** to switch on Supabase + Claude.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (theme tokens in `app/globals.css` via `@theme`)
- **Supabase** — auth (Google + email/password + email verification) & database
- **Anthropic Claude** — AI feasibility + roadmap + nutrition (server route, local fallback)
- **next-intl** — EN/RU localization (cookie-based)
- Fonts via `next/font`: **Anton** (display), **Oswald** (condensed), **Inter** (body)

## Getting started

```bash
npm install
npm run dev                 # http://localhost:3000
cp .env.example .env.local  # then follow SETUP.md to fill in keys
```

## What's built

### Landing (`/`) — EN/RU
`SiteNav` · `Hero` · `AudienceSplit` · `FeaturePreview` · `FinalCTA` · `SiteFooter`, with a `LocaleSwitcher`.

### Onboarding (`/onboarding`)
Client-side stepper (`OnboardingFlow`) with a "round" progress rail:
1. **`PathSelector`** — Beginner vs. Experienced / Pro
2. **`ProfileForm`** — stats + sex, **multi-select & custom goals**, **flexible timeframe** (6w / 3m / 6m / custom), conditional target weight
3. **`SetupStep`** — training environment + equipment inventory + free-text notes
4. **`FuelStep`** — nutrition access tier, supplements, diet notes
5. **`AnalysisReveal`** — AI **feasibility %**, verdict, phased **roadmap**, fuel plan, belt unlock (Novice)
6. **`DashboardPreview`** — teaser: session, rank ladder, goal/streak, nutrition (marked _Preview_)

Shared state is a `useReducer` over the `Profile` in `lib/onboarding.ts`.

### Accounts
`/login`, `/register`, `/verify-email`, `/dashboard` (guarded), plus `/auth/callback` & `/auth/signout`. Session refresh + route protection in `proxy.ts`.

### AI
`app/api/analyze/route.ts` — Claude (`claude-opus-4-8`, override via `ANTHROPIC_MODEL`) returns the `Analysis` shape and answers in the active locale; falls back to `lib/analysis.ts`'s local engine on any error or missing key.

## Project structure

```
app/
  layout.tsx              # fonts, i18n provider, grain overlay
  globals.css             # design tokens (@theme), base, animations
  page.tsx                # landing
  onboarding/page.tsx     # <OnboardingFlow />
  (auth)/                 # login, register, verify-email (+ layout)
  auth/                   # callback + signout route handlers
  dashboard/page.tsx      # guarded dashboard shell
  api/analyze/route.ts    # Claude analysis (local fallback)
components/
  ui/ landing/ onboarding/ auth/
lib/
  onboarding.ts           # types, constants (paths/goals/timeframes/equipment/nutrition/ranks), reducer
  analysis.ts             # feasibility+roadmap engine + requestAnalysis()
  supabase/               # client, server, middleware(proxy), user, config
i18n/request.ts           # cookie-based locale
messages/{en,ru}.json     # translations
proxy.ts                  # Supabase session + route guard (Next 16 "proxy")
```

## Design system

Dark, gritty boxing-gym aesthetic, tokens in `app/globals.css`: surfaces `void→charcoal→surface→surface-2`, accents `blood`/`ember`, text `bone`/`ash`/`ash-dim`, `font-display`/`font-condensed`/`font-body`. Reusable: `.kicker`, `.badge`, `.btn*`, `.panel`, `.shine`, `animate-rise/pop/glow`.

## Roadmap / next steps

- Translate the onboarding + dashboard screens (infra is in place — add keys + `useTranslations`)
- Persist the profile to Supabase and render it in the real `/dashboard`
- Then the previewed features: streaks, lesson library, calorie counter, technique self-check
